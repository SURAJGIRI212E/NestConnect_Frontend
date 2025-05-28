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
    <section className="max-w-4xl mx-auto p-8 relative">
      <button 
        onClick={() => navigate(-1)} 
        className="absolute top-8 left-8 p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <IoMdClose size={24} />
      </button>
      <h1 className="text-5xl font-bold mt-24 mb-4 text-center">Upgrade to Premium</h1>
      <p className="text-center text-gray-600 mb-8">Get access to all features and benefits of X Premium.</p>
      <article className="bg-white rounded-lg shadow-lg p-8">
        <header className="flex justify-between items-center mb-6">
          <div className="flex bg-gray-100 rounded-full p-1 mb-4">
            <div className="flex bg-gray-100 rounded-full p-1 ">
              <button 
                onClick={() => handlePlanChange('monthly')}
                className={`flex-1 py-2 px-4 rounded-full ${
                  selectedPlan === 'monthly' ? 'bg-white shadow-sm font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => handlePlanChange('annual')} 
                className={`flex-1 py-2 px-4 rounded-full ${
                  selectedPlan === 'annual' ? 'bg-white shadow-sm font-medium' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Annual
              </button>
            </div>
            
          </div>
         
          <div className="flex flex-col items-end">
            <div className="flex gap-4">
              <p className="text-3xl font-bold">{selectedPlan === 'monthly' ? '₹650/month' : '₹6,240/year'}</p>
              <p className={`text-lg font-bold text-gray-400 ${selectedPlan === 'annual' ? 'line-through' : ''}`}>₹7,800/year</p>
            </div>
           { selectedPlan === 'annual' && <p className="text-green-600 font-medium">Save 20% with annual planr</p>}
          </div>
        </header>

        <button className="w-full bg-[#171a1c] text-white py-3 rounded-full font-semibold hover:bg-[#24272a] transition mb-8">
          Get Premium and Pay
        </button>

        <table className="w-full border-collapse rounded-lg overflow-hidden">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4">Features</th>
              <th className="p-4 text-center">Free</th>
              <th className="p-4 text-center">Basic</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr className="hover:bg-gray-50">
              <td className="p-4">Blue Verification Badge</td>
              <td className="text-center text-red-500">✕</td>
              <td className="text-center text-black-500">✓</td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="p-4">Edit Posts</td>
              <td className="text-center text-red-500">✕</td>
              <td className="text-center text-black-500">✓</td>
            </tr>
            <tr className="hover:bg-gray-50">
              <td className="p-4">Longer Posts</td>
              <td className="text-center text-red-600">✕</td>
              <td className="text-center text-black-500">✓</td>
            </tr>
           
          </tbody>
        </table>
      </article>
    </section>
  )
}
