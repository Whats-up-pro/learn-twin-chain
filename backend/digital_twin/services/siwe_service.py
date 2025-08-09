"""
SIWE (Sign-In with Ethereum) service for wallet authentication
"""
import os
import secrets
import time
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from siwe import SiweMessage
from siwe.siwe import InvalidSignature, ExpiredMessage, MalformedSession
from eth_account import Account
from eth_account.messages import encode_defunct
import logging

from ..models.wallet import WalletLink, SIWENonce
from ..models.user import User
from .redis_service import RedisService

logger = logging.getLogger(__name__)

class SIWEService:
    """SIWE (Sign-In with Ethereum) authentication service"""
    
    def __init__(self):
        self.redis_service = RedisService()
        self.domain = os.getenv("SIWE_DOMAIN", "localhost:5173")
        self.uri = os.getenv("SIWE_URI", "http://localhost:5173")
        self.nonce_ttl = 300  # 5 minutes
        
    async def generate_nonce(self, wallet_address: str, ip_address: str = None, user_agent: str = None) -> str:
        """Generate a unique nonce for SIWE authentication"""
        try:
            # Normalize wallet address
            wallet_address = wallet_address.lower()
            
            # Generate cryptographically secure nonce
            nonce = secrets.token_hex(16)
            
            # Store in database
            siwe_nonce = SIWENonce(
                nonce=nonce,
                wallet_address=wallet_address,
                expires_at=datetime.now(timezone.utc) + timedelta(seconds=self.nonce_ttl),
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            await siwe_nonce.insert()
            
            # Store in Redis for fast lookup
            await self.redis_service.set_nonce(nonce, wallet_address, self.nonce_ttl)
            
            logger.info(f"SIWE nonce generated for wallet: {wallet_address}")
            return nonce
            
        except Exception as e:
            logger.error(f"Failed to generate SIWE nonce: {e}")
            raise
    
    async def create_siwe_message(self, wallet_address: str, nonce: str, statement: str = None) -> str:
        """Create SIWE message for signing"""
        try:
            # Default statement
            if not statement:
                statement = "Sign in to LearnTwinChain with your Ethereum account."
            
            # Create SIWE message
            message = SiweMessage(
                domain=self.domain,
                address=wallet_address,
                statement=statement,
                uri=self.uri,
                version="1",
                chain_id=1,  # Ethereum mainnet (will be overridden by user's network)
                nonce=nonce,
                issued_at=datetime.now(timezone.utc).isoformat(),
                expiration_time=(datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
            )
            
            return message.prepare_message()
            
        except Exception as e:
            logger.error(f"Failed to create SIWE message: {e}")
            raise
    
    async def verify_siwe_signature(self, message: str, signature: str, wallet_address: str) -> Dict[str, Any]:
        """Verify SIWE signature and return verification result"""
        try:
            # Parse SIWE message
            siwe_message = SiweMessage.from_message(message)
            
            # Normalize addresses
            wallet_address = wallet_address.lower()
            siwe_address = siwe_message.address.lower()
            
            # Verify address matches
            if wallet_address != siwe_address:
                raise ValueError("Wallet address mismatch")
            
            # Verify nonce exists and is valid
            nonce_data = await self.redis_service.get_nonce(siwe_message.nonce)
            if not nonce_data:
                # Check database as fallback
                nonce_record = await SIWENonce.find_one({
                    "nonce": siwe_message.nonce,
                    "used": False,
                    "expires_at": {"$gt": datetime.now(timezone.utc)}
                })
                if not nonce_record:
                    raise ValueError("Invalid or expired nonce")
                nonce_data = {"wallet_address": nonce_record.wallet_address}
            
            # Verify nonce wallet address
            if nonce_data["wallet_address"].lower() != wallet_address:
                raise ValueError("Nonce wallet address mismatch")
            
            # Verify signature
            try:
                siwe_message.verify(signature)
            except (InvalidSignature, ExpiredMessage, MalformedSession) as e:
                raise ValueError(f"SIWE verification failed: {e}")
            
            # Mark nonce as used
            await self._consume_nonce(siwe_message.nonce)
            
            # Return verification result
            result = {
                "valid": True,
                "address": wallet_address,
                "nonce": siwe_message.nonce,
                "message": message,
                "signature": signature,
                "chain_id": siwe_message.chain_id,
                "issued_at": siwe_message.issued_at,
                "expiration_time": siwe_message.expiration_time
            }
            
            logger.info(f"SIWE signature verified for wallet: {wallet_address}")
            return result
            
        except Exception as e:
            logger.error(f"SIWE signature verification failed: {e}")
            return {
                "valid": False,
                "error": str(e),
                "address": wallet_address
            }
    
    async def _consume_nonce(self, nonce: str):
        """Mark nonce as used"""
        try:
            # Remove from Redis
            await self.redis_service.delete_nonce(nonce)
            
            # Mark as used in database
            nonce_record = await SIWENonce.find_one({"nonce": nonce})
            if nonce_record:
                nonce_record.mark_used()
                await nonce_record.save()
                
        except Exception as e:
            logger.error(f"Failed to consume nonce {nonce}: {e}")
    
    async def link_wallet_to_user(self, user_id: str, wallet_address: str, signature: str, message: str, nonce: str) -> WalletLink:
        """Link a verified wallet to a user account"""
        try:
            # Normalize wallet address
            wallet_address = wallet_address.lower()
            
            # Check if wallet is already linked to another user
            existing_link = await WalletLink.find_one({
                "wallet_address": wallet_address,
                "is_active": True
            })
            
            if existing_link and existing_link.user_id != user_id:
                raise ValueError("Wallet is already linked to another account")
            
            # Check if user already has this wallet linked
            user_link = await WalletLink.find_one({
                "user_id": user_id,
                "wallet_address": wallet_address
            })
            
            if user_link:
                # Update existing link
                user_link.signature = signature
                user_link.message = message
                user_link.nonce = nonce
                user_link.is_active = True
                user_link.last_used = datetime.now(timezone.utc)
                await user_link.save()
                
                logger.info(f"Wallet link updated for user {user_id}: {wallet_address}")
                return user_link
            
            # Check if this should be the primary wallet
            existing_wallets = await WalletLink.find({
                "user_id": user_id,
                "is_active": True
            }).to_list()
            
            is_primary = len(existing_wallets) == 0
            
            # Create new wallet link
            wallet_link = WalletLink(
                user_id=user_id,
                wallet_address=wallet_address,
                signature=signature,
                message=message,
                nonce=nonce,
                linked_at=datetime.now(timezone.utc),
                is_primary=is_primary,
                is_active=True
            )
            
            await wallet_link.insert()
            
            logger.info(f"Wallet linked to user {user_id}: {wallet_address}")
            return wallet_link
            
        except Exception as e:
            logger.error(f"Failed to link wallet {wallet_address} to user {user_id}: {e}")
            raise
    
    async def unlink_wallet(self, user_id: str, wallet_address: str) -> bool:
        """Unlink a wallet from a user account"""
        try:
            wallet_address = wallet_address.lower()
            
            wallet_link = await WalletLink.find_one({
                "user_id": user_id,
                "wallet_address": wallet_address,
                "is_active": True
            })
            
            if not wallet_link:
                raise ValueError("Wallet link not found")
            
            # Deactivate the link
            wallet_link.is_active = False
            await wallet_link.save()
            
            # If this was the primary wallet, make another wallet primary
            if wallet_link.is_primary:
                other_wallets = await WalletLink.find({
                    "user_id": user_id,
                    "is_active": True,
                    "wallet_address": {"$ne": wallet_address}
                }).to_list()
                
                if other_wallets:
                    other_wallets[0].is_primary = True
                    await other_wallets[0].save()
            
            logger.info(f"Wallet unlinked from user {user_id}: {wallet_address}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to unlink wallet {wallet_address} from user {user_id}: {e}")
            raise
    
    async def get_user_wallets(self, user_id: str) -> list[WalletLink]:
        """Get all active wallets for a user"""
        try:
            wallets = await WalletLink.find({
                "user_id": user_id,
                "is_active": True
            }).to_list()
            
            return wallets
            
        except Exception as e:
            logger.error(f"Failed to get wallets for user {user_id}: {e}")
            return []
    
    async def get_primary_wallet(self, user_id: str) -> Optional[WalletLink]:
        """Get the primary wallet for a user"""
        try:
            wallet = await WalletLink.find_one({
                "user_id": user_id,
                "is_primary": True,
                "is_active": True
            })
            
            return wallet
            
        except Exception as e:
            logger.error(f"Failed to get primary wallet for user {user_id}: {e}")
            return None
    
    async def set_primary_wallet(self, user_id: str, wallet_address: str) -> bool:
        """Set a wallet as the primary wallet for a user"""
        try:
            wallet_address = wallet_address.lower()
            
            # Remove primary status from all wallets
            user_wallets = await WalletLink.find({
                "user_id": user_id,
                "is_active": True
            }).to_list()
            
            found_wallet = None
            for wallet in user_wallets:
                if wallet.wallet_address == wallet_address:
                    wallet.is_primary = True
                    found_wallet = wallet
                else:
                    wallet.is_primary = False
                await wallet.save()
            
            if not found_wallet:
                raise ValueError("Wallet not found for user")
            
            logger.info(f"Primary wallet set for user {user_id}: {wallet_address}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to set primary wallet for user {user_id}: {e}")
            raise
    
    async def verify_wallet_ownership(self, wallet_address: str, message: str, signature: str) -> bool:
        """Verify that a wallet address signed a message"""
        try:
            # Recover the address from the signature
            message_hash = encode_defunct(text=message)
            recovered_address = Account.recover_message(message_hash, signature=signature)
            
            # Compare addresses (case-insensitive)
            return recovered_address.lower() == wallet_address.lower()
            
        except Exception as e:
            logger.error(f"Wallet ownership verification failed: {e}")
            return False
    
    async def get_wallet_user(self, wallet_address: str) -> Optional[User]:
        """Get user associated with a wallet address"""
        try:
            wallet_address = wallet_address.lower()
            
            wallet_link = await WalletLink.find_one({
                "wallet_address": wallet_address,
                "is_active": True
            })
            
            if not wallet_link:
                return None
            
            user = await User.find_one({
                "did": wallet_link.user_id,
                "is_active": True
            })
            
            return user
            
        except Exception as e:
            logger.error(f"Failed to get user for wallet {wallet_address}: {e}")
            return None
    
    async def cleanup_expired_nonces(self):
        """Clean up expired nonces (should be run periodically)"""
        try:
            # Clean up database nonces
            result = await SIWENonce.find({
                "expires_at": {"$lt": datetime.now(timezone.utc)}
            }).delete()
            
            if result.deleted_count > 0:
                logger.info(f"Cleaned up {result.deleted_count} expired SIWE nonces")
            
        except Exception as e:
            logger.error(f"Failed to cleanup expired nonces: {e}")