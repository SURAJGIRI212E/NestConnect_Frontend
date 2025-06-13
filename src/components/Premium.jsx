import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { IoMdClose } from "react-icons/io";

export const Premium = () => {
    const [selectedPlan, setSelectedPlan] = useState('annual');
    const navigate = useNavigate();
    const prices = {
      monthly: {
        price: '₹650/month',
        originalAnnual: '₹7,800/year', 
        discountedAnnual: '₹6,240/year',
        buttonText: '₹650'
      },
      annual: {
        price: '₹6,240/year',
        originalAnnual: '₹7,800/year',
        discountedAnnual: '₹6,240/year', 
        buttonText: '₹6,240'
      }
    };

    const handlePlanChange = (plan) => {
      setSelectedPlan(plan);
    };
  return (
    <section className="max-w-4xl mx-auto px-4 py-8 md:px-8 relative">
      <button 
        onClick={() => navigate(-1)} 
        className="absolute top-8 left-8 p-2 rounded-full hover:bg-white hover:bg-opacity-30 transition-colors text-gray-800"
      >
        <IoMdClose size={24} />
      </button>
      <h1 className="text-3xl md:text-5xl font-bold mt-16 md:mt-24 mb-4 text-center text-gray-900">Upgrade to Premium</h1>
      <p className="text-center text-gray-600 mb-6 md:mb-8 text-sm md:text-base">Get access to all features and benefits of X Premium.</p>
      <article className="bg-white bg-opacity-20 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg border border-white border-opacity-30 p-4 md:p-8">
        <header className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div className="flex bg-white bg-opacity-30 rounded-full p-1 mb-4 md:mb-0">
            <div className="flex bg-white bg-opacity-30 rounded-full p-1 ">
              <button 
                onClick={() => handlePlanChange('monthly')}
                className={`flex-1 py-1 px-2 md:py-2 md:px-4 rounded-full ${
                  selectedPlan === 'monthly' ? 'bg-white shadow-sm font-semibold text-gray-800' : 'text-gray-700 hover:bg-opacity-40'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => handlePlanChange('annual')} 
                className={`flex-1 py-2 px-4 rounded-full ${
                  selectedPlan === 'annual' ? 'bg-white shadow-sm font-semibold text-gray-800' : 'text-gray-700 hover:bg-opacity-40'
                }`}
              >
                Annual
              </button>
            </div>
            
          </div>
         
          <div className="flex flex-col items-end">
            <div className="flex gap-2 md:gap-4">
              <p className="text-xl md:text-3xl font-bold text-gray-900">{selectedPlan === 'monthly' ? '₹650/month' : '₹6,240/year'}</p>
              <p className={`text-sm md:text-lg font-bold text-gray-500 ${selectedPlan === 'annual' ? 'line-through' : ''}`}>₹7,800/year</p>
            </div>
           { selectedPlan === 'annual' && <p className="text-green-500 font-medium text-sm md:text-base">Save 20% with annual plan</p>}
          </div>
        </header>

        <button className="w-full bg-blue-500 text-white py-2 md:py-3 rounded-full font-semibold hover:bg-blue-600 transition duration-200 mb-6 md:mb-8 text-sm md:text-base">
          Get Premium and Pay
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
              <td className="p-2 md:p-4 text-gray-700">Blue Verification Badge</td>
              <td className="text-center text-red-500">✕</td>
              <td className="text-center text-blue-500">✓</td>
            </tr>
            <tr className="hover:bg-white hover:bg-opacity-10">
              <td className="p-2 md:p-4 text-gray-700">Edit Posts</td>
              <td className="text-center text-red-500">✕</td>
              <td className="text-center text-blue-500">✓</td>
            </tr>
            <tr className="hover:bg-white hover:bg-opacity-10">
              <td className="p-2 md:p-4 text-gray-700">Longer Posts</td>
              <td className="text-center text-red-600">✕</td>
              <td className="text-center text-blue-500">✓</td>
            </tr>
           
          </tbody>
        </table>
      </article>
    </section>
  )
}
