import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { subscriptionService } from '../services/subscriptionService';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Processing your payment...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const transactionId = searchParams.get('transaction_id') || searchParams.get('vnp_TxnRef') || '';
    const vnpResponseCode = searchParams.get('vnp_ResponseCode');
    const hasVnpParams = !!vnpResponseCode;
    if (!transactionId) {
      setError('Missing transaction ID');
      return;
    }

    const checkAndRefresh = async () => {
      try {
        if (hasVnpParams) {
          const gatewayData: Record<string, string> = {};
          (searchParams as any).forEach((value: string, key: string) => {
            if (key.startsWith('vnp_')) gatewayData[key] = value;
          });
          await subscriptionService.sendGatewayWebhook('vnpay_qr', gatewayData);
        }

        // Poll payment status a few times in case webhook is slightly delayed
        let statusOk = false;
        for (let i = 0; i < 8; i++) {
          const status = await subscriptionService.getPaymentStatus(transactionId);
          if (status?.transaction?.status === 'completed') {
            statusOk = true;
            break;
          }
          await new Promise((r) => setTimeout(r, 1000));
        }

        if (!statusOk) {
          const confirm = await subscriptionService.confirmPayment({ transaction_id: transactionId, payment_method: hasVnpParams ? 'vnpay_qr' : 'credit_card' });
          if (!confirm.success) {
            setError('Payment not confirmed yet. Please wait a moment and check Payment History.');
            return;
          }
        }

        setMessage('Payment confirmed. Updating your subscription...');

        // Proactively refresh subscription server-side and notify UI
        try {
          await subscriptionService.getCurrentSubscription();
        } catch {}
        try {
          localStorage.setItem('subscription_updated_at', Date.now().toString());
          window.dispatchEvent(new CustomEvent('subscriptionUpdated'));
        } catch {}

        // Navigate to Subscription page and ensure UI updates without manual refresh
        setTimeout(() => {
          navigate('/subscription', { replace: true });
          // As a final fallback, hard-reload shortly after navigation to reflect latest plan
          setTimeout(() => {
            try {
              if (window.location.pathname === '/subscription') {
                window.location.reload();
              }
            } catch {}
          }, 600);
        }, 800);
      } catch (e: any) {
        setError(e?.message || 'Failed to verify payment');
      }
    };

    checkAndRefresh();
  }, [navigate, searchParams]);

  const transactionId = searchParams.get('transaction_id') || searchParams.get('vnp_TxnRef') || '';

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="relative bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
          {/* Header stripe */}
          <div className="h-2 bg-gradient-to-r from-green-400 via-blue-500 to-indigo-500" />

          <div className="p-8">
            {!error ? (
              <div className="text-center">
                {/* Success / Processing icon */}
                {message.includes('Processing') ? (
                  <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center animate-pulse">
                    <ArrowPathIcon className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                ) : (
                  <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
                    <CheckCircleIcon className="w-10 h-10 text-green-600" />
                  </div>
                )}

                <h1 className="text-2xl font-bold text-gray-900">
                  {message.includes('Processing') ? 'Processing Payment' : 'Payment Successful'}
                </h1>
                <p className="text-gray-600 mt-2">{message}</p>

                {transactionId && (
                  <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                    <CreditCardIcon className="w-4 h-4 mr-1" />
                    Transaction: <span className="ml-1 font-mono">{transactionId.slice(0, 8)}…{transactionId.slice(-6)}</span>
                  </div>
                )}

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => navigate('/subscription')}
                    className="px-5 py-2.5 rounded-xl bg-green-600 text-white hover:bg-green-700 transition"
                  >
                    Go to Subscription
                  </button>
                  <button
                    onClick={() => navigate('/payments')}
                    className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-800 hover:bg-gray-50 transition"
                  >
                    View Payment History
                  </button>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-800 hover:bg-gray-50 transition"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-10 h-10 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Payment Pending</h1>
                <p className="text-gray-600 mt-2">{error}</p>
                {transactionId && (
                  <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                    <CreditCardIcon className="w-4 h-4 mr-1" />
                    Transaction: <span className="ml-1 font-mono">{transactionId.slice(0, 8)}…{transactionId.slice(-6)}</span>
                  </div>
                )}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
                  >
                    Retry Verification
                  </button>
                  <button
                    onClick={() => navigate('/payments')}
                    className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-800 hover:bg-gray-50 transition"
                  >
                    View Payment History
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;


