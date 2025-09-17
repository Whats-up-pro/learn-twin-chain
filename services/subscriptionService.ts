/**
 * Subscription service for managing user subscriptions and payments
 */
import { apiService } from './apiService';

export interface SubscriptionPlan {
  plan: 'basic' | 'premium';
  name: string;
  description: string;
  monthly_price: number;
  yearly_price: number;
  currency: string;
  features: string[];
  limits: {
    max_courses: number;
    max_ai_queries_per_day: number;
    video_quality: string;
    nft_tier: string;
    mentoring_sessions: number;
    lab_access: boolean;
    early_access: boolean;
    advanced_features: boolean;
  };
  is_popular: boolean;
  yearly_discount: number;
}

export interface UserSubscription {
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

export interface PaymentTransaction {
  id: string;
  amount: number;
  currency: string;
  payment_method: 'credit_card' | 'vnpay_qr';
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  description: string;
  created_at: string;
  completed_at: string | null;
}

export interface SubscriptionHistory {
  id: string;
  plan: 'basic' | 'premium';
  status: string;
  billing_cycle: string;
  price: number;
  start_date: string;
  end_date: string;
  cancelled_at: string | null;
  payment_method: string;
  created_at: string;
}

export interface CreateSubscriptionRequest {
  plan: 'basic' | 'premium';
  billing_cycle: 'monthly' | 'yearly';
  payment_method: 'credit_card' | 'vnpay_qr';
}

export interface CreateSubscriptionResponse {
  success: boolean;
  payment_url?: string;
  transaction_id: string;
  amount: number;
  currency: string;
  error?: string;
}

export interface PaymentStatusResponse {
  success: boolean;
  transaction: PaymentTransaction;
  error?: string;
}

export interface PaymentConfirmRequest {
  transaction_id: string;
  payment_method: 'credit_card' | 'vnpay_qr';
}

export interface PaymentConfirmResponse {
  success: boolean;
  message?: string;
  subscription_id?: string;
  error?: string;
}

class SubscriptionService {
  /**
   * Get all available subscription plans
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const response = await apiService.get<{plans: SubscriptionPlan[]}>('/subscription/plans');
      return response.plans || [];
    } catch (error) {
      console.error('Failed to fetch subscription plans:', error);
      throw error;
    }
  }

  /**
   * Get user's current subscription
   */
  async getCurrentSubscription(): Promise<UserSubscription> {
    try {
      const response = await apiService.get<{subscription: UserSubscription}>('/subscription/current');
      return response.subscription || {
        has_subscription: false,
        plan: null,
        plan_name: null,
        status: null,
        features: [],
        limits: {},
        days_remaining: 0,
        billing_cycle: '',
        price: 0,
        start_date: '',
        end_date: ''
      };
    } catch (error) {
      console.error('Failed to fetch current subscription:', error);
      throw error;
    }
  }

  /**
   * Get user's subscription history
   */
  async getSubscriptionHistory(): Promise<SubscriptionHistory[]> {
    try {
      const response = await apiService.get<{history: SubscriptionHistory[]}>('/subscription/history');
      return response.history || [];
    } catch (error) {
      console.error('Failed to fetch subscription history:', error);
      throw error;
    }
  }

  /**
   * Create a new subscription
   */
  async createSubscription(request: CreateSubscriptionRequest): Promise<CreateSubscriptionResponse> {
    try {
      const response = await apiService.post<CreateSubscriptionResponse>('/subscription/create', request);
      return response;
    } catch (error: any) {
      console.error('Failed to create subscription:', error);
      if (error.message?.includes('404')) {
        throw new Error('Subscription service is not available. Please try again later.');
      }
      throw new Error(error.message || 'Failed to create subscription');
    }
  }

  /**
   * Get payment transaction status
   */
  async getPaymentStatus(transactionId: string): Promise<PaymentStatusResponse> {
    try {
      const response = await apiService.get<PaymentStatusResponse>(`/subscription/payment/status/${transactionId}`);
      return response;
    } catch (error) {
      console.error('Failed to fetch payment status:', error);
      throw error;
    }
  }

  /**
   * Confirm payment after success redirect (fallback when webhook delayed)
   */
  async confirmPayment(req: PaymentConfirmRequest): Promise<PaymentConfirmResponse> {
    try {
      const response = await apiService.post<PaymentConfirmResponse>('/subscription/payment/confirm', req);
      return response;
    } catch (error) {
      console.error('Failed to confirm payment:', error);
      throw error;
    }
  }

  /**
   * Send payment gateway payload to backend webhook for immediate processing
   */
  async sendGatewayWebhook(payment_method: 'vnpay_qr' | 'credit_card', gateway_data: Record<string, any>) {
    try {
      const response = await apiService.post<{ success: boolean; message?: string; error?: string }>(
        '/subscription/payment/webhook',
        { payment_method, gateway_data }
      );
      return response;
    } catch (error) {
      console.error('Failed to send gateway webhook:', error);
      throw error;
    }
  }

  /**
   * Cancel user's current subscription
   */
  async cancelSubscription(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiService.post<{ success: boolean; message: string }>('/subscription/cancel');
      return response;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  /**
   * Get user's available features
   */
  async getUserFeatures(): Promise<{
    features: string[];
    limits: Record<string, any>;
    plan: 'basic' | 'premium' | null;
    has_subscription: boolean;
  }> {
    try {
      const response = await apiService.get<{
        features: string[];
        limits: Record<string, any>;
        plan: 'basic' | 'premium' | null;
        has_subscription: boolean;
      }>('/subscription/features');
      return response;
    } catch (error) {
      console.error('Failed to fetch user features:', error);
      throw error;
    }
  }

  /**
   * Check if user can access a specific course
   */
  async checkCourseAccess(courseId: string): Promise<{ has_access: boolean }> {
    try {
      const response = await apiService.get<{ has_access: boolean }>(`/subscription/check-access/${courseId}`);
      return response;
    } catch (error) {
      console.error('Failed to check course access:', error);
      throw error;
    }
  }

  /**
   * Get user's payment history
   */
  async getPaymentHistory(): Promise<PaymentTransaction[]> {
    try {
      const response = await apiService.get<{payments: PaymentTransaction[]}>('/subscription/payment-history');
      return response.payments || [];
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
      throw error;
    }
  }

  /**
   * Format price for display
   */
  formatPrice(amount: number, currency: string = 'VND'): string {
    if (currency === 'VND') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(amount);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Get payment method display info
   */
  getPaymentMethodInfo(method: 'credit_card' | 'vnpay_qr') {
    const methods = {
      credit_card: {
        name: 'Credit Card',
        icon: '💳',
        logo: '/images/payment/credit-card.svg',
        description: 'Pay with Visa, Mastercard, or other major credit cards'
      },
      vnpay_qr: {
        name: 'VNPAY QR',
        icon: '🔲',
        logo: 'https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR-1.png',
        description: 'Scan VNPAY QR to pay securely'
      }
    };
    return methods[method];
  }

  /**
   * Check if user has access to a feature
   */
  async hasFeatureAccess(feature: string): Promise<boolean> {
    try {
      const features = await this.getUserFeatures();
      return features.limits[feature] === true || features.limits[feature] > 0;
    } catch (error) {
      console.error('Failed to check feature access:', error);
      return false;
    }
  }

  /**
   * Check AI query limit status
   */
  async checkAIQueryLimit(): Promise<{
    can_query: boolean;
    daily_limit: number;
    queries_used: number;
    queries_remaining: number;
    plan_name: string;
    unlimited: boolean;
  }> {
    try {
      const response = await apiService.get('/subscription/ai-query-limit');
      return response.limit_info;
    } catch (error) {
      console.error('Failed to check AI query limit:', error);
      return {
        can_query: false,
        daily_limit: 0,
        queries_used: 0,
        queries_remaining: 0,
        plan_name: 'Error',
        unlimited: false
      };
    }
  }

  /**
   * Check if user can access a course based on difficulty
   */
  async canAccessCourse(difficultyLevel: string): Promise<boolean> {
    try {
      const subscription = await this.getCurrentSubscription();
      
      // If no subscription, only allow beginner courses
      if (!subscription.has_subscription) {
        return difficultyLevel === 'beginner';
      }

      // Basic plan: beginner and intermediate
      if (subscription.plan === 'basic') {
        return ['beginner', 'intermediate'].includes(difficultyLevel);
      }

      // Premium plan: all courses
      if (subscription.plan === 'premium') {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to check course access:', error);
      return false;
    }
  }
}

export const subscriptionService = new SubscriptionService();
