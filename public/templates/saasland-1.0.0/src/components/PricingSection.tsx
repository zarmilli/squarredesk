
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Check } from 'lucide-react';

const PricingSection = () => {
  const [isAnnual, setIsAnnual] = useState(true);
  
  const plans = [
    {
      name: 'Starter',
      monthlyPrice: 19,
      annualPrice: 15,
      description: 'Perfect for small businesses and freelancers',
      features: [
        '2 team members',
        '20GB cloud storage',
        'Basic analytics',
        'Email support',
        '1 project'
      ],
      isPopular: false,
      ctaText: 'Start with Starter'
    },
    {
      name: 'Professional',
      monthlyPrice: 49,
      annualPrice: 39,
      description: 'Great for growing businesses and teams',
      features: [
        '10 team members',
        '100GB cloud storage',
        'Advanced analytics',
        'Priority email support',
        'Unlimited projects',
        'API access',
        'Custom integration'
      ],
      isPopular: true,
      ctaText: 'Start with Pro'
    },
    {
      name: 'Enterprise',
      monthlyPrice: 99,
      annualPrice: 79,
      description: 'For large organizations with complex needs',
      features: [
        'Unlimited team members',
        '500GB cloud storage',
        'Advanced analytics & reporting',
        '24/7 dedicated support',
        'Unlimited projects',
        'Full API access',
        'Custom integration',
        'SSO Authentication',
        'Dedicated account manager'
      ],
      isPopular: false,
      ctaText: 'Contact Sales'
    }
  ];

  return (
    <div className="bg-gradient-to-b from-saas-darkGray to-saas-black py-16 md:py-24">
      <div className="section-container">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, <span className="gradient-text">Transparent</span> Pricing
          </h2>
          <p className="text-gray-400 mb-8">
            Choose the plan that fits your business needs. No hidden fees, no surprises.
          </p>
          
          {/* Pricing toggle */}
          <div className="flex items-center justify-center space-x-4 mb-12">
            <span className={`text-sm font-medium ${isAnnual ? 'text-saas-orange' : 'text-gray-400'}`}>
              Annual <span className="text-xs text-saas-orange">(Save 20%)</span>
            </span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${isAnnual ? 'bg-saas-orange' : 'bg-gray-600'}`}
            >
              <span 
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isAnnual ? 'translate-x-7' : 'translate-x-1'}`}
              />
            </button>
            <span className={`text-sm font-medium ${!isAnnual ? 'text-saas-orange' : 'text-gray-400'}`}>
              Monthly
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`rounded-2xl p-8 transition-all duration-300 ${
                plan.isPopular 
                  ? 'bg-gradient-to-b from-saas-orange/20 to-saas-black border border-saas-orange/30 transform hover:-translate-y-2' 
                  : 'bg-saas-darkGray border border-gray-800 transform hover:-translate-y-1'
              }`}
            >
              {plan.isPopular && (
                <span className="bg-saas-orange text-saas-black text-xs font-bold px-3 py-1 rounded-full uppercase mb-4 inline-block">
                  Most Popular
                </span>
              )}
              
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-gray-400 mb-6">{plan.description}</p>
              
              <div className="mb-6">
                <span className="text-4xl font-bold">
                  ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                </span>
                <span className="text-gray-400"> /month</span>
              </div>
              
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <Check className="h-5 w-5 text-saas-orange mr-2 shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className={`w-full ${
                  plan.isPopular 
                    ? 'bg-saas-orange hover:bg-orange-600 text-white' 
                    : 'bg-secondary border border-saas-orange/30 hover:border-saas-orange text-white'
                }`}
              >
                {plan.ctaText}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PricingSection;
