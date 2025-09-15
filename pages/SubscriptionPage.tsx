import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckIcon, 
  StarIcon, 
  CreditCardIcon, 
  BanknotesIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  BoltIcon,
  AcademicCapIcon,
  SparklesIcon,
  RocketLaunchIcon,
  HeartIcon,
  GiftIcon
} from '@heroicons/react/24/outline';
import { subscriptionService } from '../services/subscriptionService';
import { useAppContext } from '../contexts/AppContext';

interface SubscriptionPlan {
  plan: 'basic' | 'premium';
  name: string;
  description: string;
  monthly_price: number;
  yearly_price: number;
  features: string[];
  limits: Record<string, any>;
  is_popular?: boolean;
  badge?: string;
  icon?: string;
  color?: string;
}

interface UserSubscription {
  has_subscription: boolean;
  plan: 'basic' | 'premium' | null;
  plan_name: string | null;
  status: string | null;
  features: string[];
  limits: Record<string, any>;
  days_remaining: number;
  billing_cycle: string;
  price: number;
  start_date: string;
  end_date: string;
}

const SubscriptionPage: React.FC = () => {
  const navigate = useNavigate();
  const { learnerProfile } = useAppContext();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium'>('basic');
  const [selectedBilling, setSelectedBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPayment, setSelectedPayment] = useState<'credit_card' | 'vnpay_qr'>('credit_card');
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const [plansData, currentSub] = await Promise.all([
        subscriptionService.getSubscriptionPlans(),
        subscriptionService.getCurrentSubscription()
      ]);
      
      setPlans(plansData);
      setCurrentSubscription(currentSub);
      
      // Set default selection based on current subscription
      if (currentSub?.has_subscription) {
        setSelectedPlan(currentSub.plan || 'basic');
      }
    } catch (error) {
      console.error('Failed to load subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!learnerProfile) {
      navigate('/login');
      return;
    }

    try {
      setIsProcessing(true);
      
      const result = await subscriptionService.createSubscription({
        plan: selectedPlan,
        billing_cycle: selectedBilling,
        payment_method: selectedPayment
      });

      if (result.success && result.payment_url) {
        // Redirect to payment URL
        window.location.href = result.payment_url;
      } else {
        throw new Error(result.error || 'Failed to create subscription');
      }
    } catch (error: any) {
      console.error('Subscription failed:', error);
      
      // Show user-friendly error message
      let errorMessage = error.message;
      if (error.message?.includes('404') || error.message?.includes('not available')) {
        errorMessage = 'Subscription service is currently unavailable. Please try again later or contact support.';
      }
      
      alert(`Subscription failed: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (amount: number) => {
    return subscriptionService.formatPrice(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full mb-4">
            <RocketLaunchIcon className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
            Chọn Gói Học Tập
          </h1>
          <p className="text-base text-gray-700 max-w-2xl mx-auto leading-relaxed mb-4">
            Nâng cao kỹ năng blockchain và Web3 với các gói học tập được thiết kế đặc biệt cho từng cấp độ
          </p>
          
          {/* Trust indicators */}
          <div className="flex items-center justify-center space-x-6 text-xs text-gray-600">
            <div className="flex items-center">
              <ShieldCheckIcon className="w-4 h-4 text-green-500 mr-1.5" />
              Bảo mật tuyệt đối
            </div>
            <div className="flex items-center">
              <BoltIcon className="w-4 h-4 text-blue-500 mr-1.5" />
              Hỗ trợ 24/7
            </div>
            <div className="flex items-center">
              <HeartIcon className="w-4 h-4 text-red-500 mr-1.5" />
              Bảo đảm hoàn tiền
            </div>
          </div>
        </div>

        {/* Current Subscription Status */}
        {currentSubscription?.has_subscription && (
          <div className="max-w-4xl mx-auto mb-6">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 backdrop-blur-sm border border-green-200 rounded-xl p-4 shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <CheckIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Gói hiện tại: {currentSubscription.plan_name}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {currentSubscription.days_remaining} ngày còn lại • 
                      Gia hạn: {new Date(currentSubscription.end_date).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-600 text-sm font-medium">Đang hoạt động</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Billing Toggle */}
        <div className="flex justify-center mb-6">
          <div className="bg-white backdrop-blur-sm rounded-xl p-1.5 flex border border-blue-200 shadow">
            <button
              onClick={() => setSelectedBilling('monthly')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                selectedBilling === 'monthly'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              Hàng tháng
            </button>
            <button
              onClick={() => setSelectedBilling('yearly')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative ${
                selectedBilling === 'yearly'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              Hàng năm
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-green-400 to-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                <GiftIcon className="w-3 h-3 inline mr-1" />
                Tiết kiệm 20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto mb-8">
          {plans.map((plan) => {
            const isPopular = plan.is_popular;
            const isSelected = selectedPlan === plan.plan;
            const isCurrentPlan = currentSubscription?.plan === plan.plan;
            const price = selectedBilling === 'yearly' ? plan.yearly_price : plan.monthly_price;
            const originalPrice = selectedBilling === 'yearly' ? plan.monthly_price * 12 : plan.monthly_price;
            const savings = selectedBilling === 'yearly' ? originalPrice - price : 0;

            const planColors = {
              basic: {
                gradient: 'from-blue-500 to-cyan-500',
                bg: 'from-blue-50 to-cyan-50',
                border: 'border-blue-200',
                accent: 'text-blue-600'
              },
              premium: {
                gradient: 'from-indigo-500 to-blue-600',
                bg: 'from-indigo-50 to-blue-50',
                border: 'border-indigo-200',
                accent: 'text-indigo-600'
              }
            };

            const colors = planColors[plan.plan];

            return (
              <div
                key={plan.plan}
                className={`relative group transition-all duration-300 ${
                  isPopular ? 'lg:-mt-4' : ''
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-8 py-3 rounded-full text-sm font-bold flex items-center shadow-lg animate-pulse">
                      <StarIcon className="w-5 h-5 mr-2" />
                      Phổ biến nhất
                    </div>
                  </div>
                )}

                <div
                  className={`relative bg-white rounded-2xl border ${colors.border} transition-all duration-300 ${
                    isSelected ? 'ring-2 ring-blue-300/60 shadow-xl' : 'hover:shadow-md shadow'
                  } ${isCurrentPlan ? 'opacity-80' : ''}`}
                >
                  {/* Plan Header */}
                  <div className="p-8 pb-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center">
                        <div className={`w-16 h-16 bg-gradient-to-r ${colors.gradient} rounded-2xl flex items-center justify-center mr-4 shadow-lg`}>
                          {plan.plan === 'basic' ? (
                            <AcademicCapIcon className="w-8 h-8 text-white" />
                          ) : (
                            <SparklesIcon className="w-8 h-8 text-white" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-800">{plan.name}</h3>
                          <p className={`text-sm ${colors.accent} font-medium`}>
                            {plan.badge || (plan.plan === 'basic' ? 'Bắt đầu hành trình' : 'Nâng cao chuyên nghiệp')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="mb-6">
                      <div className="flex items-baseline">
                        <span className="text-5xl font-bold text-gray-800">{formatPrice(price)}</span>
                        <span className="text-gray-600 ml-2">/{selectedBilling === 'yearly' ? 'năm' : 'tháng'}</span>
                      </div>
                      {savings > 0 && (
                        <div className="flex items-center mt-2">
                          <span className="text-lg text-gray-500 line-through">{formatPrice(originalPrice)}</span>
                          <span className="ml-3 bg-green-500 text-white text-sm px-3 py-1 rounded-full font-medium">
                            Tiết kiệm {formatPrice(savings)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Plan Description */}
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      {plan.description}
                    </p>

                    {/* Select Button */}
                    <button
                      onClick={() => setSelectedPlan(plan.plan)}
                      disabled={isCurrentPlan}
                      className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 ${
                        isCurrentPlan
                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                          : isSelected
                          ? `bg-gradient-to-r ${colors.gradient} text-white shadow-lg transform scale-105`
                          : `bg-gray-50 text-gray-700 border-2 ${colors.border} hover:bg-gray-100`
                      }`}
                    >
                      {isCurrentPlan ? (
                        <div className="flex items-center justify-center">
                          <CheckIcon className="w-5 h-5 mr-2" />
                          Gói hiện tại
                        </div>
                      ) : isSelected ? (
                        'Đã chọn'
                      ) : (
                        'Chọn gói này'
                      )}
                    </button>
                  </div>

                  {/* Features */}
                  <div className="px-8 pb-8">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <StarIcon className="w-5 h-5 mr-2 text-yellow-500" />
                      Tính năng bao gồm
                    </h4>
                    <div className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-start">
                          <CheckIcon className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600 leading-relaxed">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Special Features for Premium */}
                  {plan.plan === 'premium' && (
                    <div className="px-8 pb-8">
                      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-4 border border-indigo-200">
                        <h5 className="text-indigo-600 font-semibold mb-2 flex items-center">
                          <SparklesIcon className="w-4 h-4 mr-2" />
                          Tính năng độc quyền
                        </h5>
                        <div className="text-sm text-indigo-700 space-y-1">
                          <div>• Truy cập sớm các khóa học mới</div>
                          <div>• Mentoring 1-1 với chuyên gia</div>
                          <div>• NFT trading marketplace</div>
                          <div>• Hỗ trợ ưu tiên 24/7</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Payment Methods */}
        <div className="max-w-4xl mx-auto mb-8">
          <h3 className="text-2xl font-bold text-gray-800 text-center mb-8">Chọn phương thức thanh toán</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['credit_card', 'vnpay_qr'] as const).map((method) => {
              const methodInfo = subscriptionService.getPaymentMethodInfo(method);
              const isSelected = selectedPayment === method;

              return (
                <button
                  key={method}
                  onClick={() => setSelectedPayment(method)}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 bg-white ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-lg transform scale-105'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    {method === 'credit_card' ? (
                      <div className="text-3xl">💳</div>
                    ) : (
                      <img 
                        src={methodInfo.logo} 
                        alt={methodInfo.name}
                        className="w-10 h-10 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    )}
                    <div className="text-left">
                      <div className="font-semibold text-gray-800">{methodInfo.name}</div>
                      <div className="text-sm text-gray-600">{methodInfo.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Subscribe Button */}
        <div className="text-center">
          <button
            onClick={handleSubscribe}
            disabled={isProcessing || !learnerProfile || currentSubscription?.plan === selectedPlan}
            className={`px-12 py-4 rounded-2xl font-bold text-xl transition-all duration-300 ${
              isProcessing || !learnerProfile || currentSubscription?.plan === selectedPlan
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600 shadow-2xl transform hover:scale-105'
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Đang xử lý...
              </div>
            ) : !learnerProfile ? (
              'Đăng nhập để tiếp tục'
            ) : currentSubscription?.plan === selectedPlan ? (
              'Gói hiện tại'
            ) : (
              <div className="flex items-center">
                <RocketLaunchIcon className="w-6 h-6 mr-2" />
                Bắt đầu ngay
              </div>
            )}
          </button>
          
          {learnerProfile && (
            <p className="text-gray-600 text-sm mt-4">
              Bạn sẽ được chuyển đến trang thanh toán an toàn
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <div className="flex items-center justify-center space-x-8 text-gray-600 text-sm">
            <div className="flex items-center">
              <ShieldCheckIcon className="w-4 h-4 mr-2" />
              Bảo mật SSL 256-bit
            </div>
            <div className="flex items-center">
              <HeartIcon className="w-4 h-4 mr-2" />
              Hoàn tiền trong 30 ngày
            </div>
            <div className="flex items-center">
              <BoltIcon className="w-4 h-4 mr-2" />
              Hủy bất kỳ lúc nào
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;