import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { IoMdClose } from "react-icons/io";
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../utils/axios';
import { useSubscriptionPlans, useSubscriptionStatus } from '../hooks/useSubscription';
import { useQueryClient } from '@tanstack/react-query';
import   { LargePremiumBadge } from '../minicomponents/PremiumBadge';
import LoadingShimmer from './LoadingShimmer';

export const Premium = () => {
    const [selectedPlan, setSelectedPlan] = useState('ANNUAL');
    const navigate = useNavigate();
    const { user } = useAuth();
  const { data: plans, isLoading: plansLoading } = useSubscriptionPlans();
  const { data: status, isLoading: statusLoading } = useSubscriptionStatus();
  const queryClient = useQueryClient();
  
    const handlePlanChange = (plan) => {
      setSelectedPlan(plan);
    };

    const handlePayment = async () => {
      // 1. Call backend to create subscription
      const { data } = await axiosInstance.post('/api/subscription/create', {
        planId: selectedPlan === 'MONTHLY'
          ? process.env.REACT_APP_RAZORPAY_MONTHLY_PLAN_ID
          : process.env.REACT_APP_RAZORPAY_ANNUAL_PLAN_ID
      });

      // 2. Open Razorpay checkout
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        subscription_id: data.subscriptionId,
        name: 'NestConnect Premium',
        description: 'Premium Subscription',
        handler: function (response) {
        // 3. Notify backend to activate premium
        
        },
        prefill: {
          email: user.email,
          name: user.fullName,
        },
        theme: { color: '#357df0' }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    };

    const handleCancel = async () => {
      if (window.confirm("Are you sure you want to cancel the subscription?")){
      try {
        await axiosInstance.post('/api/subscription/cancel');
        queryClient.invalidateQueries(['subscriptionStatus']);

      } catch (err) {
        console.error('Cancel subscription failed');
      }
    }};

  // Use new backend subscription status fields
  if (statusLoading) return <LoadingShimmer/>;
  if (status?.isActive) {
    return (
      <section className="max-w-3xl mx-auto px-4 py-10 md:px-8  relative flex flex-col items-center justify-center bg-gradient-to-br from-blue-300 via-white to-blue-400 rounded-2xl shadow-2xl border border-blue-300">
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-8 left-8 p-2 rounded-full bg-white bg-opacity-70 hover:bg-blue-200 transition-colors text-blue-700 shadow-md"
        >
          <IoMdClose size={28} />
        </button>
        <div className="flex flex-col items-center justify-center mt-8 mb-6">
          <div className="bg-gradient-to-tr from-blue-400 via-blue-100 to-blue-400 px-5 py-4 rounded-full shadow-lg mb-4 animate-bounce">
            <LargePremiumBadge/>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-2 text-center text-blue-700 drop-shadow-lg">Premium Unlocked!</h1>
          <p className="text-center text-blue-600 mb-4 text-lg md:text-2xl font-semibold">Thank you for supporting us. Enjoy your exclusive features.</p>
        </div>
        <div className="w-full flex flex-col md:flex-row items-center justify-center gap-8 mb-8">
          <div className="bg-white bg-opacity-80 rounded-xl shadow-md p-6 flex-1 text-center">
            <p className="text-gray-700 text-lg font-medium mb-2">Subscription started</p>
            <p className="text-blue-600 text-xl font-bold">{status.startDate ? new Date(status.startDate).toLocaleDateString() : 'N/A'}</p>
          </div>
          <div className="bg-white bg-opacity-80 rounded-xl shadow-md p-6 flex-1 text-center">
            <p className="text-gray-700 text-lg font-medium mb-2">Subscription ends</p>
            <p className="text-blue-600 text-xl font-bold">{status.endDate ? new Date(status.endDate).toLocaleDateString() : 'N/A'}</p>
          </div>
          <div className="bg-white bg-opacity-80 rounded-xl shadow-md p-6 flex-1 text-center">
            <p className="text-gray-700 text-lg font-medium mb-2">Plan</p>
            <p className="text-blue-600 text-xl font-bold">{status.plan || 'N/A'}</p>
          </div>
        </div>
        <div className="flex flex-col items-center mt-4">
          <span className="inline-block bg-blue-600 text-white px-6 py-2 rounded-full font-semibold shadow-lg text-lg animate-pulse">Premium Activated</span>
          {status?.plan ==='Monthly' && <button onClick={handleCancel} className="mt-4 text-xs text-gray-500 hover:underline transition">Cancel Subscription</button>}
        </div>
      </section>
    );
  }
  if (plansLoading) return <LoadingShimmer/>;
  return (
    <section className="max-w-4xl mx-auto px-4 py-8 md:px-8 relative">
      <button 
        onClick={() => navigate(-1)} 
        className="absolute top-8 left-8 p-2 rounded-full hover:bg-white hover:bg-opacity-30 transition-colors text-gray-800"
      >
        <IoMdClose size={24} />
      </button>
      <h1 className="text-3xl md:text-5xl font-bold mt-16 md:mt-24 mb-4 text-center text-gray-900">Upgrade to Premium</h1>
      <p className="text-center text-gray-700 mb-6 md:mb-8 text-sm md:text-base">Get access to all features and benefits of X Premium.</p>
      <article className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg border border-white border-opacity-30 p-4 md:p-8">
        <header className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div className="flex bg-white bg-opacity-30 rounded-full p-1 mb-4 md:mb-0">
            <div className="flex bg-white bg-opacity-30 rounded-full p-1 ">
              <button 
                onClick={() => handlePlanChange('MONTHLY')}
                className={`flex-1 py-1 px-2 md:py-2 md:px-4 rounded-full ${
                  selectedPlan === 'MONTHLY' ? 'bg-white shadow-sm font-semibold text-gray-800' : 'text-gray-700 hover:bg-opacity-40'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => handlePlanChange('ANNUAL')} 
                className={`flex-1 py-2 px-4 rounded-full ${
                  selectedPlan === 'ANNUAL' ? 'bg-white shadow-sm font-semibold text-gray-800' : 'text-gray-700 hover:bg-opacity-40'
                }`}
              >
                Annual
              </button>
            </div>
            
          </div>
         
          <div className="flex flex-col items-end">
            <div className="flex gap-2 md:gap-4">
              <p className="text-xl md:text-3xl font-bold text-gray-900">Rs { plans[selectedPlan].price}</p>
              <p className={`text-sm md:text-lg font-bold text-gray-500 ${selectedPlan === 'ANNUAL' ? 'line-through' : ''}`}>{plans['MONTHLY'].price*12}/Yearly</p>
            </div>
           { selectedPlan === 'ANNUAL' && <p className="text-green-500 font-medium text-sm md:text-base">Save 20% with annual plan</p>}
          </div>
        </header>

        <button onClick={handlePayment} className="w-full bg-blue-600 text-white py-2 md:py-3 rounded-full font-semibold hover:bg-blue-700 transition duration-200 mb-6 md:mb-8 text-sm md:text-base">
          Get Premium and Pay {plans[selectedPlan].buttonText}
        </button>

        <table className="w-full border-collapse rounded-lg overflow-hidden text-xs md:text-sm border border-white border-opacity-30">
          <thead className="bg-white bg-opacity-30">
            <tr>
              <th className="text-left p-2 md:p-4 text-gray-800">Features</th>
              <th className="p-4 text-center text-gray-800">Free</th>
              <th className="p-4 text-center text-gray-800">Basic</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white divide-opacity-30">
            <tr className="hover:bg-white hover:bg-opacity-10">
              <td className="p-2 md:p-4 text-gray-700 font-semibold text-base">Blue Verification Badge</td>
              <td className="text-center text-red-600 text-xl">✕</td>
              <td className="text-center text-blue-600 text-xl">✓</td>
            </tr>
            <tr className="hover:bg-white hover:bg-opacity-10">
              <td className="p-2 md:p-4 text-gray-700 font-semibold text-base">More chance and More time to Edit  Posts</td>
              <td className="text-center text-red-600 text-xl">✕</td>
              <td className="text-center text-blue-600 text-xl">✓</td>
            </tr>
            <tr className="hover:bg-white hover:bg-opacity-10">
              <td className="p-2 md:p-4 text-gray-700 font-semibold text-base">Longer Posts (higher character limit per post)</td>
              <td className="text-center text-red-600 text-xl">✕</td>
              <td className="text-center text-blue-600 text-xl">✓</td>
            </tr>
            <tr className="hover:bg-white hover:bg-opacity-10">
              <td className="p-2 md:p-4 text-gray-700 font-semibold text-base">Large size file uploads for posts (images/videos)</td>
              <td className="text-center text-red-600 text-xl">✕</td>
              <td className="text-center text-blue-600 text-xl">✓</td>
            </tr>
             <tr className="hover:bg-white hover:bg-opacity-10">
              <td className="p-2 md:p-4 text-gray-700 font-semibold text-base">Higher file size limits (images up to 5MB, videos up to 200MB)</td>
              <td className="text-center text-red-600 text-xl">✕</td>
              <td className="text-center text-blue-600 text-xl">✓</td>
            </tr>
           
          </tbody>
        </table>
      </article>
    </section>
  )
}
