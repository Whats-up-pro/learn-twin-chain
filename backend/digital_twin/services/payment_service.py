"""
Payment service for handling Vietnamese payment methods
"""
import logging
import uuid
import hashlib
import hmac
import json
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import aiohttp
import asyncio

from ..models.subscription import PaymentTransaction, PaymentMethod, PaymentStatus

logger = logging.getLogger(__name__)

class PaymentService:
    """Service for handling payment processing"""
    
    def __init__(self):
        # Payment gateway configurations (in production, these should be in environment variables)
        self.gateways = {
            PaymentMethod.CREDIT_CARD: {
                "name": "Stripe",
                "api_key": "sk_test_...",  # Replace with actual Stripe test key
                "webhook_secret": "whsec_...",
                "base_url": "https://api.stripe.com/v1"
            },
            PaymentMethod.ZALO_PAY: {
                "name": "ZaloPay",
                "app_id": "your_zalopay_app_id",
                "key1": "your_zalopay_key1",
                "key2": "your_zalopay_key2",
                "base_url": "https://sb-openapi.zalopay.vn/v2"
            },
            PaymentMethod.MOMO: {
                "name": "MoMo",
                "partner_code": "your_momo_partner_code",
                "access_key": "your_momo_access_key",
                "secret_key": "your_momo_secret_key",
                "base_url": "https://test-payment.momo.vn/v2/gateway/api"
            }
        }
    
    async def create_payment_request(
        self,
        transaction_id: str,
        amount: float,
        payment_method: PaymentMethod,
        description: str,
        return_url: str,
        user_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create payment request with selected gateway"""
        try:
            if payment_method == PaymentMethod.CREDIT_CARD:
                return await self._create_stripe_payment(transaction_id, amount, description, return_url, user_info)
            elif payment_method == PaymentMethod.ZALO_PAY:
                return await self._create_zalopay_payment(transaction_id, amount, description, return_url, user_info)
            elif payment_method == PaymentMethod.MOMO:
                return await self._create_momo_payment(transaction_id, amount, description, return_url, user_info)
            else:
                raise ValueError(f"Unsupported payment method: {payment_method}")
                
        except Exception as e:
            logger.error(f"Failed to create payment request: {e}")
            raise
    
    async def _create_stripe_payment(
        self,
        transaction_id: str,
        amount: float,
        description: str,
        return_url: str,
        user_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create Stripe payment intent"""
        try:
            # Convert VND to cents (Stripe uses smallest currency unit)
            amount_cents = int(amount * 100)  # VND doesn't have decimal places, but Stripe expects cents
            
            headers = {
                "Authorization": f"Bearer {self.gateways[PaymentMethod.CREDIT_CARD]['api_key']}",
                "Content-Type": "application/x-www-form-urlencoded"
            }
            
            data = {
                "amount": amount_cents,
                "currency": "vnd",
                "payment_method_types[]": "card",
                "metadata[transaction_id]": transaction_id,
                "metadata[user_email]": user_info.get("email", ""),
                "description": description,
                "confirm": "true",
                "return_url": return_url
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.gateways[PaymentMethod.CREDIT_CARD]['base_url']}/payment_intents",
                    headers=headers,
                    data=data
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return {
                            "success": True,
                            "payment_url": result.get("next_action", {}).get("redirect_to_url", {}).get("url"),
                            "gateway_transaction_id": result.get("id"),
                            "status": "requires_action" if result.get("status") == "requires_action" else "succeeded"
                        }
                    else:
                        error_text = await response.text()
                        logger.error(f"Stripe API error: {response.status} - {error_text}")
                        return {"success": False, "error": f"Payment gateway error: {response.status}"}
                        
        except Exception as e:
            logger.error(f"Stripe payment creation failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def _create_zalopay_payment(
        self,
        transaction_id: str,
        amount: float,
        description: str,
        return_url: str,
        user_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create ZaloPay payment request"""
        try:
            config = self.gateways[PaymentMethod.ZALO_PAY]
            
            # ZaloPay order data
            order_data = {
                "app_id": config["app_id"],
                "app_trans_id": transaction_id,
                "app_user": user_info.get("email", ""),
                "amount": int(amount),  # VND amount
                "app_time": int(datetime.now(timezone.utc).timestamp() * 1000),
                "item": json.dumps([{
                    "item_id": transaction_id,
                    "item_name": description,
                    "item_price": int(amount),
                    "item_quantity": 1
                }]),
                "description": description,
                "embed_data": json.dumps({
                    "merchantinfo": "LearnTwinChain",
                    "redirecturl": return_url
                }),
                "bank_code": "zalopayapp"
            }
            
            # Create MAC signature
            data_str = f"{order_data['app_id']}|{order_data['app_trans_id']}|{order_data['app_user']}|{order_data['amount']}|{order_data['app_time']}|{order_data['embed_data']}|{order_data['item']}"
            mac = hmac.new(
                config["key1"].encode(),
                data_str.encode(),
                hashlib.sha256
            ).hexdigest()
            order_data["mac"] = mac
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{config['base_url']}/create",
                    json=order_data,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        if result.get("return_code") == 1:
                            return {
                                "success": True,
                                "payment_url": result.get("order_url"),
                                "gateway_transaction_id": result.get("zp_trans_id"),
                                "status": "pending"
                            }
                        else:
                            return {"success": False, "error": result.get("return_message", "Unknown error")}
                    else:
                        error_text = await response.text()
                        logger.error(f"ZaloPay API error: {response.status} - {error_text}")
                        return {"success": False, "error": f"Payment gateway error: {response.status}"}
                        
        except Exception as e:
            logger.error(f"ZaloPay payment creation failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def _create_momo_payment(
        self,
        transaction_id: str,
        amount: float,
        description: str,
        return_url: str,
        user_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create MoMo payment request"""
        try:
            config = self.gateways[PaymentMethod.MOMO]
            
            # MoMo payment data
            order_data = {
                "partnerCode": config["partner_code"],
                "partnerName": "LearnTwinChain",
                "storeId": "LearnTwinChain",
                "requestId": transaction_id,
                "amount": int(amount),
                "orderId": transaction_id,
                "orderInfo": description,
                "redirectUrl": return_url,
                "ipnUrl": f"{return_url}/momo/callback",  # Callback URL for payment status
                "lang": "vi",
                "extraData": "",
                "requestType": "captureWallet",
                "signature": ""  # Will be calculated
            }
            
            # Create signature
            raw_signature = f"accessKey={config['access_key']}&amount={order_data['amount']}&extraData={order_data['extraData']}&ipnUrl={order_data['ipnUrl']}&orderId={order_data['orderId']}&orderInfo={order_data['orderInfo']}&partnerCode={order_data['partnerCode']}&redirectUrl={order_data['redirectUrl']}&requestId={order_data['requestId']}&requestType={order_data['requestType']}"
            signature = hmac.new(
                config["secret_key"].encode(),
                raw_signature.encode(),
                hashlib.sha256
            ).hexdigest()
            order_data["signature"] = signature
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    config["base_url"] + "/create",
                    json=order_data,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        if result.get("resultCode") == 0:
                            return {
                                "success": True,
                                "payment_url": result.get("payUrl"),
                                "gateway_transaction_id": result.get("transId"),
                                "status": "pending"
                            }
                        else:
                            return {"success": False, "error": result.get("message", "Unknown error")}
                    else:
                        error_text = await response.text()
                        logger.error(f"MoMo API error: {response.status} - {error_text}")
                        return {"success": False, "error": f"Payment gateway error: {response.status}"}
                        
        except Exception as e:
            logger.error(f"MoMo payment creation failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def verify_payment(
        self,
        transaction_id: str,
        payment_method: PaymentMethod,
        gateway_response: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Verify payment status with gateway"""
        try:
            if payment_method == PaymentMethod.CREDIT_CARD:
                return await self._verify_stripe_payment(transaction_id, gateway_response)
            elif payment_method == PaymentMethod.ZALO_PAY:
                return await self._verify_zalopay_payment(transaction_id, gateway_response)
            elif payment_method == PaymentMethod.MOMO:
                return await self._verify_momo_payment(transaction_id, gateway_response)
            else:
                return {"success": False, "error": f"Unsupported payment method: {payment_method}"}
                
        except Exception as e:
            logger.error(f"Payment verification failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def _verify_stripe_payment(
        self,
        transaction_id: str,
        gateway_response: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Verify Stripe payment"""
        try:
            config = self.gateways[PaymentMethod.CREDIT_CARD]
            
            headers = {
                "Authorization": f"Bearer {config['api_key']}",
                "Content-Type": "application/json"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{config['base_url']}/payment_intents/{transaction_id}",
                    headers=headers
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        status = result.get("status")
                        
                        return {
                            "success": True,
                            "status": "completed" if status == "succeeded" else "pending",
                            "gateway_data": result
                        }
                    else:
                        return {"success": False, "error": f"Verification failed: {response.status}"}
                        
        except Exception as e:
            logger.error(f"Stripe verification failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def _verify_zalopay_payment(
        self,
        transaction_id: str,
        gateway_response: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Verify ZaloPay payment"""
        try:
            config = self.gateways[PaymentMethod.ZALO_PAY]
            
            # ZaloPay query data
            query_data = {
                "app_id": config["app_id"],
                "app_trans_id": transaction_id
            }
            
            # Create MAC signature
            data_str = f"{query_data['app_id']}|{query_data['app_trans_id']}|{config['key1']}"
            mac = hmac.new(
                config["key1"].encode(),
                data_str.encode(),
                hashlib.sha256
            ).hexdigest()
            query_data["mac"] = mac
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{config['base_url']}/query",
                    json=query_data,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return_code = result.get("return_code")
                        
                        return {
                            "success": True,
                            "status": "completed" if return_code == 1 else "pending",
                            "gateway_data": result
                        }
                    else:
                        return {"success": False, "error": f"Verification failed: {response.status}"}
                        
        except Exception as e:
            logger.error(f"ZaloPay verification failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def _verify_momo_payment(
        self,
        transaction_id: str,
        gateway_response: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Verify MoMo payment"""
        try:
            config = self.gateways[PaymentMethod.MOMO]
            
            # MoMo query data
            query_data = {
                "partnerCode": config["partner_code"],
                "requestId": transaction_id,
                "orderId": transaction_id,
                "lang": "vi",
                "signature": ""  # Will be calculated
            }
            
            # Create signature
            raw_signature = f"accessKey={config['access_key']}&orderId={query_data['orderId']}&partnerCode={query_data['partnerCode']}&requestId={query_data['requestId']}"
            signature = hmac.new(
                config["secret_key"].encode(),
                raw_signature.encode(),
                hashlib.sha256
            ).hexdigest()
            query_data["signature"] = signature
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    config["base_url"] + "/query",
                    json=query_data,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        result_code = result.get("resultCode")
                        
                        return {
                            "success": True,
                            "status": "completed" if result_code == 0 else "pending",
                            "gateway_data": result
                        }
                    else:
                        return {"success": False, "error": f"Verification failed: {response.status}"}
                        
        except Exception as e:
            logger.error(f"MoMo verification failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def handle_payment_webhook(
        self,
        payment_method: PaymentMethod,
        webhook_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Handle payment webhook from gateway"""
        try:
            if payment_method == PaymentMethod.CREDIT_CARD:
                return await self._handle_stripe_webhook(webhook_data)
            elif payment_method == PaymentMethod.ZALO_PAY:
                return await self._handle_zalopay_webhook(webhook_data)
            elif payment_method == PaymentMethod.MOMO:
                return await self._handle_momo_webhook(webhook_data)
            else:
                return {"success": False, "error": f"Unsupported payment method: {payment_method}"}
                
        except Exception as e:
            logger.error(f"Webhook handling failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def _handle_stripe_webhook(self, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle Stripe webhook"""
        try:
            event_type = webhook_data.get("type")
            data = webhook_data.get("data", {}).get("object", {})
            
            if event_type == "payment_intent.succeeded":
                transaction_id = data.get("metadata", {}).get("transaction_id")
                if transaction_id:
                    return {
                        "success": True,
                        "transaction_id": transaction_id,
                        "status": "completed",
                        "gateway_transaction_id": data.get("id")
                    }
            
            return {"success": False, "error": "Unhandled webhook event"}
            
        except Exception as e:
            logger.error(f"Stripe webhook handling failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def _handle_zalopay_webhook(self, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle ZaloPay webhook"""
        try:
            # ZaloPay webhook structure
            app_trans_id = webhook_data.get("app_trans_id")
            zp_trans_id = webhook_data.get("zp_trans_id")
            status = webhook_data.get("status")
            
            if status == 1:  # Payment successful
                return {
                    "success": True,
                    "transaction_id": app_trans_id,
                    "status": "completed",
                    "gateway_transaction_id": zp_trans_id
                }
            
            return {"success": False, "error": "Payment not completed"}
            
        except Exception as e:
            logger.error(f"ZaloPay webhook handling failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def _handle_momo_webhook(self, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle MoMo webhook"""
        try:
            # MoMo webhook structure
            order_id = webhook_data.get("orderId")
            trans_id = webhook_data.get("transId")
            result_code = webhook_data.get("resultCode")
            
            if result_code == 0:  # Payment successful
                return {
                    "success": True,
                    "transaction_id": order_id,
                    "status": "completed",
                    "gateway_transaction_id": trans_id
                }
            
            return {"success": False, "error": "Payment not completed"}
            
        except Exception as e:
            logger.error(f"MoMo webhook handling failed: {e}")
            return {"success": False, "error": str(e)}
