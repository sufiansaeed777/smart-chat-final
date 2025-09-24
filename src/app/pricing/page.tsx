'use client';

import React from 'react';
import { Check, ArrowRight, Star } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const PricingPage = () => {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      description: "For testing & small blogs",
      features: [
        "1 Bot / 1 Website",
        "50 Conversations / Month",
        "1 Team Member",
        "2MB per File (10MB Quota)",
        "1 Parallel Chat at a time",
        "Unlimited Links",
        "Default Templates Only"
      ],
      cta: "Get Started Free",
      popular: false,
      highlight: false
    },
    {
      name: "Starter",
      price: "$19",
      period: "/month",
      yearlyPrice: "$190",
      yearlyPeriod: "/year",
      description: "For freelancers & small businesses",
      features: [
        "2 Bots / 2 Websites",
        "1,000 Conversations / Month",
        "2 Team Members",
        "5MB per File (50MB Quota)",
        "10 Parallel Chats at a time",
        "Unlimited Links",
        "Default Templates",
        "Limited Analytics Dashboard",
        "Email Support"
      ],
      cta: "Start Free Trial",
      popular: true,
      highlight: true
    },
    {
      name: "Pro",
      price: "$49",
      period: "/month",
      yearlyPrice: "$490",
      yearlyPeriod: "/year",
      description: "For agencies & e-commerce",
      features: [
        "5 Bots / 5 Websites",
        "10,000 Conversations / Month",
        "5 Team Members",
        "10MB per File (200MB Quota)",
        "25 Parallel Chats at a time",
        "Unlimited Links",
        "Default + Custom Templates",
        "Customize Branding (Colors, Logo, Theme)",
        "API Access + Integrations",
        "Priority Email & Chat Support",
        "Full Analytics Dashboard"
      ],
      cta: "Start Free Trial",
      popular: false,
      highlight: false
    },
    {
      name: "Enterprise",
      price: "$99",
      period: "/month",
      yearlyPrice: "$990",
      yearlyPeriod: "/year",
      description: "For large businesses & SaaS",
      features: [
        "20 Bots / Unlimited Websites",
        "50,000 Conversations / Month",
        "20+ Team Members",
        "25MB per File (1GB Quota)",
        "Unlimited Links",
        "100 Parallel Chats at a time",
        "White Label (Your Brand Only)",
        "Dedicated Account Manager",
        "Premium Integrations",
        "Advanced Reporting & Team Collaboration"
      ],
      cta: "Start Free Trial",
      popular: false,
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Navigation */}
      <Navigation />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-12 lg:px-16">
          <div className="max-w-6xl mx-auto">
            {/* Page header */}
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
                Simple, Transparent{" "}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Pricing
                </span>
              </h1>
               <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed whitespace-nowrap mb-24">
                Choose the plan that fits your needs. All paid plans include a 14-day free trial.
              </p>
            </div>

            {/* Pricing cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {plans.slice(0, 3).map((plan, index) => (
                <div
                  key={index}
                  className={`relative border rounded-2xl p-8 shadow-lg transition-all duration-300 flex flex-col hover:scale-105 ${
                    plan.popular
                      ? "bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 border-blue-500 shadow-blue-500/30 hover:shadow-blue-500/70"
                      : "bg-white border-slate-200 hover:shadow-blue-500/60 hover:shadow-4xl"
                  } ${plan.highlight ? "ring-2 ring-blue-600/20" : ""}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl whitespace-nowrap ring-2 ring-blue-600/30">
                        ★ Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center mb-8">
                    <h3 className={`text-xl font-semibold mb-2 ${
                      plan.popular 
                        ? "text-blue-800 font-bold" 
                        : "text-slate-900"
                    }`}>
                      {plan.name}
                    </h3>
                    <p className={`mb-6 ${
                      plan.popular 
                        ? "text-blue-600 font-medium" 
                        : "text-slate-600"
                    }`}>
                      {plan.description}
                    </p>
                    <div className="flex items-baseline justify-center mb-6">
                      <span className={`text-5xl font-bold ${
                        plan.popular 
                          ? "text-blue-800" 
                          : "text-slate-900"
                      }`}>
                        {plan.price}
                      </span>
                      <span className={`ml-2 text-lg ${
                        plan.popular 
                          ? "text-blue-600 font-medium" 
                          : "text-slate-600"
                      }`}>
                        {plan.period}
                      </span>
                    </div>
                    {plan.yearlyPrice && (
                      <div className="text-center mb-4">
                        <span className="text-2xl font-semibold text-slate-700">
                          {plan.yearlyPrice}
                        </span>
                        <span className="text-slate-600 ml-1">
                          {plan.yearlyPeriod}
                        </span>
                        <div className="text-sm text-green-600 font-medium mt-1">
                          Save 17% with yearly billing
                        </div>
                      </div>
                    )}
                  </div>

                  <ul className="space-y-4 mb-8 flex-grow">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                        <span className="text-slate-600 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`w-full group mt-auto py-2.5 px-6 rounded-lg font-medium transition-all duration-300 flex items-center justify-center ${
                      plan.popular 
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90" 
                        : "border-2 border-slate-200 text-slate-900 hover:border-blue-600 hover:text-blue-600"
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              ))}
            </div>


            {/* Feature Comparison Table */}
            <div className="bg-white rounded-3xl p-10 shadow-2xl mb-16 border border-slate-100">
              <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-4xl font-bold text-slate-900 mb-4">
                  Feature <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Comparison</span>
                </h3>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                  Compare features across our pricing tiers to find the best fit for your project.
                  </p>
                </div>
              
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
                      <th className="text-left py-6 px-8 font-bold text-slate-900 text-lg">Features</th>
                      <th className="text-center py-6 px-8 font-bold text-slate-900 text-lg">Free</th>
                      <th className="text-center py-6 px-8 font-bold text-slate-900 text-lg relative">
                        <div className="bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 rounded-xl p-4 -mx-2 border border-blue-200">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-blue-600 font-bold">Starter</span>
                            <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                              Most Popular
                            </span>
                          </div>
                        </div>
                      </th>
                      <th className="text-center py-6 px-8 font-bold text-slate-900 text-lg">Pro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 group">
                      <td className="py-3 px-8 font-semibold text-slate-800 group-hover:text-blue-700 transition-colors duration-200 text-lg">Bots & Websites</td>
                      <td className="text-center py-3 px-8 hover:bg-green-50 transition-all duration-300">
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                          <Check className="w-5 h-5 text-green-600" />
                        </div>
                      </td>
                      <td className="text-center py-3 px-8 hover:bg-green-50 transition-all duration-300">
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                          <Check className="w-5 h-5 text-green-600" />
                        </div>
                      </td>
                      <td className="text-center py-3 px-8 hover:bg-green-50 transition-all duration-300">
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                          <Check className="w-5 h-5 text-green-600" />
                        </div>
                      </td>
                    </tr>
                    <tr className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 group">
                      <td className="py-3 px-8 font-semibold text-slate-800 group-hover:text-blue-700 transition-colors duration-200 text-lg">Conversations / Month</td>
                      <td className="text-center py-3 px-8">
                        <span className="text-slate-700 font-semibold text-sm">50</span>
                      </td>
                      <td className="text-center py-3 px-8">
                        <span className="text-slate-700 font-semibold text-sm">1,000</span>
                      </td>
                      <td className="text-center py-3 px-8">
                        <span className="text-slate-700 font-semibold text-sm">10,000</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 group">
                      <td className="py-3 px-8 font-semibold text-slate-800 group-hover:text-blue-700 transition-colors duration-200 text-lg">Team Members</td>
                      <td className="text-center py-3 px-8">
                        <span className="text-slate-700 font-semibold text-sm">1</span>
                      </td>
                      <td className="text-center py-3 px-8">
                        <span className="text-slate-700 font-semibold text-sm">2</span>
                      </td>
                      <td className="text-center py-3 px-8">
                        <span className="text-slate-700 font-semibold text-sm">5</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 group">
                      <td className="py-3 px-8 font-semibold text-slate-800 group-hover:text-blue-700 transition-colors duration-200 text-lg">File Upload Size</td>
                      <td className="text-center py-3 px-8">
                        <span className="text-slate-700 font-semibold text-sm">2MB</span>
                      </td>
                      <td className="text-center py-3 px-8">
                        <span className="text-slate-700 font-semibold text-sm">5MB</span>
                      </td>
                      <td className="text-center py-3 px-8">
                        <span className="text-slate-700 font-semibold text-sm">10MB</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 group">
                      <td className="py-3 px-8 font-semibold text-slate-800 group-hover:text-blue-700 transition-colors duration-200 text-lg">Parallel Chats</td>
                      <td className="text-center py-3 px-8">
                        <span className="text-slate-700 font-semibold text-sm">1</span>
                      </td>
                      <td className="text-center py-3 px-8">
                        <span className="text-slate-700 font-semibold text-sm">10</span>
                      </td>
                      <td className="text-center py-3 px-8">
                        <span className="text-slate-700 font-semibold text-sm">25</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 group">
                      <td className="py-3 px-8 font-semibold text-slate-800 group-hover:text-blue-700 transition-colors duration-200 text-lg">Custom Branding</td>
                      <td className="text-center py-3 px-8 hover:bg-red-50 transition-all duration-300">
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                          <span className="text-red-500 text-2xl font-light flex items-center justify-center">×</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-8 hover:bg-red-50 transition-all duration-300">
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                          <span className="text-red-500 text-2xl font-light flex items-center justify-center">×</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-8 hover:bg-green-50 transition-all duration-300">
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                          <Check className="w-5 h-5 text-green-600" />
                        </div>
                      </td>
                    </tr>
                    <tr className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 group">
                      <td className="py-3 px-8 font-semibold text-slate-800 group-hover:text-blue-700 transition-colors duration-200 text-lg">API Access</td>
                      <td className="text-center py-3 px-8 hover:bg-red-50 transition-all duration-300">
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                          <span className="text-red-500 text-2xl font-light flex items-center justify-center">×</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-8 hover:bg-red-50 transition-all duration-300">
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                          <span className="text-red-500 text-2xl font-light flex items-center justify-center">×</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-8 hover:bg-green-50 transition-all duration-300">
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                          <Check className="w-5 h-5 text-green-600" />
                        </div>
                      </td>
                    </tr>
                    <tr className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 group">
                      <td className="py-3 px-8 font-semibold text-slate-800 group-hover:text-blue-700 transition-colors duration-200 text-lg">Analytics Dashboard</td>
                      <td className="text-center py-3 px-8 hover:bg-red-50 transition-all duration-300">
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                          <span className="text-red-500 text-2xl font-light flex items-center justify-center">×</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-8 hover:bg-green-50 transition-all duration-300">
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                          <Check className="w-5 h-5 text-green-600" />
                        </div>
                      </td>
                      <td className="text-center py-3 px-8 hover:bg-green-50 transition-all duration-300">
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                          <Check className="w-5 h-5 text-green-600" />
                        </div>
                      </td>
                    </tr>
                    <tr className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 group">
                      <td className="py-3 px-8 font-semibold text-slate-800 group-hover:text-blue-700 transition-colors duration-200 text-lg">White Label</td>
                      <td className="text-center py-3 px-8 hover:bg-red-50 transition-all duration-300">
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                          <span className="text-red-500 text-2xl font-light flex items-center justify-center">×</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-8 hover:bg-red-50 transition-all duration-300">
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                          <span className="text-red-500 text-2xl font-light flex items-center justify-center">×</span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-8 hover:bg-red-50 transition-all duration-300">
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                          <span className="text-red-500 text-2xl font-light flex items-center justify-center">×</span>
                        </div>
                      </td>
                    </tr>
                    <tr className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 group">
                      <td className="py-3 px-8 font-semibold text-slate-800 group-hover:text-blue-700 transition-colors duration-200 text-lg">Dedicated Support</td>
                      <td className="text-center py-3 px-8 hover:bg-red-50 transition-all duration-300">
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                          <span className="text-red-500 text-2xl font-light flex items-center justify-center">×</span>
                  </div>
                      </td>
                      <td className="text-center py-3 px-8 hover:bg-red-50 transition-all duration-300">
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-red-100 rounded-full">
                          <span className="text-red-500 text-2xl font-light flex items-center justify-center">×</span>
                  </div>
                      </td>
                      <td className="text-center py-3 px-8 hover:bg-green-50 transition-all duration-300">
                        <div className="inline-flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                          <Check className="w-5 h-5 text-green-600" />
                </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PricingPage;
