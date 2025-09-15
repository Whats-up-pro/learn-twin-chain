"""
Payment service for handling Vietnamese payment methods
"""
import logging
import uuid
import hashlib
import hmac
import json
from datetime import datetime, timezone, timedelta
from urllib.parse import urlencode, quote_plus
from typing import Optional, Dict, Any
import aiohttp
import asyncio

from ..models.subscription import PaymentTransaction, PaymentMethod, PaymentStatus
import os
from dotenv import load_dotenv
from pathlib import Path

logger = logging.getLogger(__name__)

class PaymentService:
    """Service for handling payment processing"""
    
    def __init__(self):
        # Load environment variables (.env). Try several common locations.
        load_dotenv()  # default
        possible_env_files = [
            Path(__file__).resolve().parents[2] / '.env',      # backend/.env
            Path.cwd() / 'backend' / '.env',                   # CWD/backend/.env
            Path.cwd() / '.env'                                # CWD/.env
        ]
        for env_path in possible_env_files:
            try:
                if env_path.exists():
                    load_dotenv(dotenv_path=str(env_path), override=False)
            except Exception:
                pass

        # Read Stripe credentials
        stripe_api_key = os.getenv("STRIPE_SECRET_KEY") or os.getenv("STRIPE_API_KEY", "")
        stripe_webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")

        if not stripe_api_key:
            logger.warning("Stripe secret key not set. Set STRIPE_SECRET_KEY in backend/.env")

        # Payment gateway configurations (in production, these should be in environment variables)
        self.gateways = {
            PaymentMethod.CREDIT_CARD: {
                "name": "Stripe",
                "api_key": stripe_api_key,
                "webhook_secret": stripe_webhook_secret,
                "base_url": "https://api.stripe.com/v1"
            },
            PaymentMethod.VNPAY_QR: {
                "name": "VNPAY QR",
                "tmn_code": os.getenv("VNPAY_TMN_CODE", "GF51M4Z3"),
                "hash_secret": os.getenv("VNPAY_HASH_SECRET", "XICUDK54WMAOY8BNR3G3ZWC4H9X2TBFB"),
                "payment_url": os.getenv("VNPAY_URL", "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"),
                "return_url": os.getenv("VNPAY_RETURN_URL", "http://localhost:5173/subscription/payment/success")
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
            elif payment_method == PaymentMethod.VNPAY_QR:
                return await self._create_vnpay_payment(transaction_id, amount, description, return_url, user_info)
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
        """Create Stripe Checkout session (collects payment method + confirmation)"""
        try:
            # Convert amount to Stripe unit. VND is a zero-decimal currency.
            # For VND, Stripe expects unit_amount in VND (no *100)
            amount_units = int(amount)

            headers = {
                "Authorization": f"Bearer {self.gateways[PaymentMethod.CREDIT_CARD]['api_key']}",
                "Content-Type": "application/x-www-form-urlencoded"
            }

            # success and cancel must be absolute URLs
            frontend_base = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173").rstrip("/")
            success_url = return_url
            cancel_url = f"{frontend_base}/subscription/payment/cancel?transaction_id={transaction_id}"

            # Create Stripe Checkout Session
            # Save card for future usage (off-session) so we can reuse it for renewals
            form = {
                "mode": "payment",
                "success_url": success_url,
                "cancel_url": cancel_url,
                "payment_method_types[]": "card",
                "metadata[transaction_id]": transaction_id,
                "customer_email": user_info.get("email", ""),
                # Ask Stripe to attach the payment method to the customer for future use
                "payment_intent_data[setup_future_usage]": "off_session",
                "line_items[0][quantity]": "1",
                "line_items[0][price_data][currency]": "vnd",
                "line_items[0][price_data][unit_amount]": str(amount_units),
                "line_items[0][price_data][product_data][name]": description or "Subscription"
            }

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.gateways[PaymentMethod.CREDIT_CARD]['base_url']}/checkout/sessions",
                    headers=headers,
                    data=form
                ) as response:
                    resp_text = await response.text()
                    if response.status >= 400:
                        logger.error(f"Stripe API error: {response.status} - {resp_text}")
                        return {"success": False, "error": resp_text}
                    result = await response.json()
                    return {
                        "success": True,
                        "payment_url": result.get("url"),
                        "gateway_transaction_id": result.get("id"),
                        "status": "pending"
                    }
        except Exception as e:
            logger.error(f"Stripe payment creation failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def _create_vnpay_payment(
        self,
        transaction_id: str,
        amount: float,
        description: str,
        return_url: str,
        user_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create VNPAY QR payment URL"""
        try:
            cfg = self.gateways[PaymentMethod.VNPAY_QR]
            vnp_Version = '2.1.0'
            vnp_Command = 'pay'
            vnp_TmnCode = cfg['tmn_code']
            vnp_Amount = int(amount) * 100  # VNPAY requires amount x100
            vnp_CurrCode = 'VND'
            vnp_TxnRef = transaction_id
            # VNPAY requires non-accented, no special characters in OrderInfo
            safe_desc = (description or 'Subscription payment')
            try:
                safe_desc = safe_desc.encode('ascii', 'ignore').decode()
            except Exception:
                pass
            vnp_OrderInfo = safe_desc
            vnp_OrderType = 'other'
            vnp_Locale = 'vn'
            # Use the passed-in return_url to include transaction id tracking
            vnp_ReturnUrl = return_url
            vnp_IpAddr = '127.0.0.1'
            # VNPAY requires GMT+7 timestamps
            gmt7 = timezone(timedelta(hours=7))
            vnp_CreateDate = datetime.now(gmt7).strftime('%Y%m%d%H%M%S')
            vnp_ExpireDate = (datetime.now(gmt7) + timedelta(minutes=15)).strftime('%Y%m%d%H%M%S')

            params = {
                'vnp_Version': vnp_Version,
                'vnp_Command': vnp_Command,
                'vnp_TmnCode': vnp_TmnCode,
                'vnp_Amount': str(vnp_Amount),
                'vnp_CurrCode': vnp_CurrCode,
                'vnp_TxnRef': vnp_TxnRef,
                'vnp_OrderInfo': vnp_OrderInfo,
                'vnp_OrderType': vnp_OrderType,
                'vnp_Locale': vnp_Locale,
                'vnp_ReturnUrl': vnp_ReturnUrl,
                'vnp_IpAddr': vnp_IpAddr,
                'vnp_CreateDate': vnp_CreateDate,
                'vnp_ExpireDate': vnp_ExpireDate
            }

            # Sort and sign
            sorted_params = {k: params[k] for k in sorted(params.keys())}
            # Build hash data using URL-encoded values per VNPAY spec
            hash_data = urlencode(sorted_params, quote_via=quote_plus)
            hash_secret = cfg['hash_secret']
            secure_hash = hmac.new(hash_secret.encode('utf-8'), hash_data.encode('utf-8'), hashlib.sha512).hexdigest()
            # Build final URL with hash type and hash
            payment_url = (
                f"{cfg['payment_url']}?{hash_data}"
                f"&vnp_SecureHashType=HmacSHA512&vnp_SecureHash={secure_hash}"
            )

            return {
                'success': True,
                'payment_url': payment_url,
                'gateway_transaction_id': transaction_id,
                'status': 'pending'
            }
        except Exception as e:
            logger.error(f"VNPAY payment creation failed: {e}")
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
            elif payment_method == PaymentMethod.VNPAY_QR:
                return await self._verify_vnpay_payment(transaction_id, gateway_response)
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
            
            # Prefer checking the Checkout Session if we have it; otherwise try payment intent id if present
            checkout_id = gateway_response.get("gateway_transaction_id") or gateway_response.get("id")
            endpoint = None
            if checkout_id:
                endpoint = f"{config['base_url']}/checkout/sessions/{checkout_id}"
            else:
                # Fallback: try payment intent with the same id (may not match our internal transaction id)
                endpoint = f"{config['base_url']}/payment_intents/{transaction_id}"

            async with aiohttp.ClientSession() as session:
                async with session.get(endpoint, headers=headers) as response:
                    if response.status == 200:
                        result = await response.json()
                        status = result.get("payment_status") or result.get("status")
                        payment_intent_id = result.get("payment_intent") or result.get("id")
                        
                        return {
                            "success": True,
                            "status": "completed" if status in ["succeeded", "paid"] else "pending",
                            "gateway_data": result,
                            "gateway_transaction_id": checkout_id or payment_intent_id
                        }
                    else:
                        return {"success": False, "error": f"Verification failed: {response.status}"}
                        
        except Exception as e:
            logger.error(f"Stripe verification failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def _verify_vnpay_payment(
        self,
        transaction_id: str,
        gateway_response: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Verify VNPAY payment from return params or IPN."""
        try:
            # For VNPAY, verification usually uses IPN parameters with vnp_SecureHash validation.
            # Here we trust IPN/webhook path; for success page confirm, we rely on transaction status stored.
            status = gateway_response.get('vnp_TransactionStatus') or gateway_response.get('vnp_ResponseCode')
            completed = str(status) in ['00']
            return {
                'success': True,
                'status': 'completed' if completed else 'pending',
                'gateway_data': gateway_response
            }
        except Exception as e:
            logger.error(f"VNPAY verification failed: {e}")
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
            elif payment_method == PaymentMethod.VNPAY_QR:
                return await self._handle_vnpay_ipn(webhook_data)
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
    
    async def _handle_vnpay_ipn(self, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle VNPAY IPN (server-to-server notify)."""
        try:
            txn_ref = webhook_data.get('vnp_TxnRef')
            response_code = webhook_data.get('vnp_ResponseCode')
            secure_hash = webhook_data.get('vnp_SecureHash')
            cfg = self.gateways[PaymentMethod.VNPAY_QR]

            # Validate signature
            params = {k: v for k, v in webhook_data.items() if k not in ('vnp_SecureHash', 'vnp_SecureHashType')}
            sorted_params = {k: params[k] for k in sorted(params.keys())}
            hash_data = urlencode(sorted_params, quote_via=quote_plus)
            expected_hash = hmac.new(cfg['hash_secret'].encode('utf-8'), hash_data.encode('utf-8'), hashlib.sha512).hexdigest()
            if secure_hash != expected_hash:
                return {"success": False, "error": "Invalid signature"}

            if response_code == '00':
                return {
                    'success': True,
                    'transaction_id': txn_ref,
                    'status': 'completed',
                    'gateway_transaction_id': webhook_data.get('vnp_TransactionNo')
                }
            return {"success": False, "error": "Payment not completed"}
        except Exception as e:
            logger.error(f"VNPAY IPN handling failed: {e}")
            return {"success": False, "error": str(e)}
