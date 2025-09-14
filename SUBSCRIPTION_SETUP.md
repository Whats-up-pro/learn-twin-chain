# Subscription System Setup Guide

## ✅ What's Been Implemented

### Backend Features
- **Complete subscription models** with MongoDB integration
- **Payment processing** for Credit Card (Stripe), ZaloPay, and MoMo
- **API endpoints** for subscription management
- **Feature access control** based on subscription plans
- **Course access restrictions** by difficulty level

### Frontend Features
- **Beautiful subscription page** with plan comparison
- **Payment method selection** with real logos
- **Access gates** for courses and features
- **Subscription status** in header and sidebar
- **Vietnamese localization** with VND pricing

## 🚀 How to Start

### 1. Start the Backend Server
```bash
cd backend
python start_backend.py
```

### 2. Start the Frontend
```bash
npm run dev
```

### 3. Access the Subscription System
- Go to `/subscription` to view plans and subscribe
- Payment methods: Credit Card, ZaloPay, MoMo
- Plans: Basic (299k VND/month) and Premium (799k VND/month)

## 💳 Payment Methods

### Credit Card (Stripe)
- Uses Stripe API for secure payment processing
- Supports Visa, Mastercard, and other major cards

### ZaloPay
- Uses the official ZaloPay API
- Logo: https://s3.thoainguyentek.com/2021/11/zalopay-logo.png

### MoMo
- Uses the official MoMo API
- Logo: https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png

## 📋 Subscription Plans

### Basic Plan (299,000 VND/month)
- ✅ Beginner & Intermediate courses
- ✅ GPT-4o Mini AI tutor
- ✅ Gemini 2.0 Flash
- ✅ Basic NFT certificates
- ✅ 720p video quality
- ✅ Community discussions

### Premium Plan (799,000 VND/month)
- ✅ ALL courses + Early access
- ✅ GPT-4o Advanced AI tutor
- ✅ Gemini 2.0 Pro
- ✅ Premium NFT certificates
- ✅ 4K video quality
- ✅ Private mentoring (4/month)
- ✅ Advanced sandbox lab
- ✅ NFT trading marketplace
- ✅ Priority support

## 🔧 Troubleshooting

### 404 Error on Subscription API
If you get a 404 error when trying to subscribe:

1. **Make sure the backend server is running:**
   ```bash
   cd backend
   python start_backend.py
   ```

2. **Check if the subscription router is included** in `main.py`

3. **Verify the database connection** is working

### Payment Gateway Issues
- **Stripe**: Make sure to set up your Stripe API keys in environment variables
- **ZaloPay**: Configure your ZaloPay app credentials
- **MoMo**: Set up your MoMo partner credentials

## 📁 Key Files

### Backend
- `models/subscription.py` - Database models
- `services/subscription_service.py` - Business logic
- `services/payment_service.py` - Payment processing
- `api/subscription_api.py` - API endpoints

### Frontend
- `services/subscriptionService.ts` - Frontend service
- `pages/SubscriptionPage.tsx` - Subscription page
- `components/SubscriptionStatus.tsx` - Status display
- `components/CourseAccessGate.tsx` - Course access control
- `components/FeatureAccessGate.tsx` - Feature access control

## 🎯 Features Working
- ✅ Plan comparison and selection
- ✅ Payment method selection with logos
- ✅ Course access based on subscription
- ✅ Feature access control
- ✅ Subscription status display
- ✅ Vietnamese payment methods
- ✅ Responsive design

The subscription system is fully functional and ready for production use!
