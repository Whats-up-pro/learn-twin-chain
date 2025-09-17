import React, { useEffect, useState } from 'react';
import { subscriptionService, PaymentTransaction } from '../services/subscriptionService';
import { useTranslation } from '../src/hooks/useTranslation';

const PaymentHistoryPage: React.FC = () => {
  const { t } = useTranslation();
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const items = await subscriptionService.getPaymentHistory();
        setPayments(items);
      } catch (e: any) {
        setError(e?.message || 'Failed to load payment history');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="animate-pulse h-6 w-40 bg-gray-200 rounded mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="h-16 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="max-w-5xl mx-auto text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('paymentHistoryPage.paymentHistory')}</h1>

      {payments.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-gray-600">{t('paymentHistoryPage.noPaymentsYet')}</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 text-sm font-semibold text-gray-600 px-4 py-3 border-b">
            <div className="col-span-3">{t('paymentHistoryPage.date')}</div>
            <div className="col-span-3">{t('paymentHistoryPage.description')}</div>
            <div className="col-span-2">{t('paymentHistoryPage.method')}</div>
            <div className="col-span-2">{t('paymentHistoryPage.amount')}</div>
            <div className="col-span-2">{t('paymentHistoryPage.status')}</div>
          </div>
          {payments.map((p) => (
            <div key={p.id} className="grid grid-cols-12 px-4 py-3 border-b last:border-b-0 text-sm">
              <div className="col-span-3 text-gray-800">
                {new Date(p.created_at).toLocaleString('vi-VN')}
              </div>
              <div className="col-span-3 text-gray-800">{p.description}</div>
              <div className="col-span-2 capitalize">{p.payment_method.replace('_', ' ')}</div>
              <div className="col-span-2 font-medium">{subscriptionService.formatPrice(p.amount, p.currency)}</div>
              <div className="col-span-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    p.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : p.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {p.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentHistoryPage;


