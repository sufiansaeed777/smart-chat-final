'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Check, ArrowRight, Calculator, Phone, ChevronUp, ChevronDown } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const PricingPage = () => {
  // Pricing Calculator State
  const [calculatorInputs, setCalculatorInputs] = useState({
    bots: 0,
    members: 0,
    conversations: 0,
    storage: 0,
    fileSize: 0,
    websites: 0,
    parallelChats: 0,
    analytics: 'Basic'
  });

  // Pricing tiers based on the provided data
  const pricingTiers = useMemo(() => ({
    bots: [
      { min: 1, max: 4, price: 3 },
      { min: 5, max: 14, price: 2.5 },
      { min: 15, max: Infinity, price: 2 }
    ],
    members: [
      { min: 1, max: 4, price: 1 },
      { min: 5, max: 20, price: 0.8 },
      { min: 21, max: Infinity, price: 0.5 }
    ],
    conversations: [
      { min: 1, max: 10000, price: 2.5 },
      { min: 10001, max: 50000, price: 2.5 },
      { min: 50001, max: Infinity, price: 2 }
    ],
    storage: [
      { min: 1, max: 200, price: 0.5 },
      { min: 201, max: 1000, price: 0.4 },
      { min: 1001, max: Infinity, price: 0.3 }
    ],
    fileSize: [
      { min: 1, max: 20, price: 0.5 },
      { min: 21, max: 50, price: 0.4 },
      { min: 51, max: Infinity, price: 0.3 }
    ],
    websites: [
      { min: 1, max: 2, price: 4 },
      { min: 3, max: 5, price: 3.5 },
      { min: 6, max: Infinity, price: 3 }
    ],
    parallelChats: [
      { min: 1, max: 50, price: 3 },
      { min: 51, max: 200, price: 2.5 },
      { min: 201, max: Infinity, price: 2 }
    ],
    analytics: {
      'Basic': 1,
      'Full': 3,
      'Enterprise': 5
    }
  }), []);

  // Custom Counter Component
  const CustomCounter = ({ value, onChange, min = 0, max = 999, step = 1, className = "" }: {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    className?: string;
  }) => {
    const handleIncrement = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const newValue = Math.min(value + step, max);
      onChange(newValue);
    };

    const handleDecrement = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      const newValue = Math.max(value - step, min);
      onChange(newValue);
    };

    return (
      <div className={`flex items-center bg-white border-2 border-slate-200 rounded-lg overflow-hidden ${className}`}>
        {/* Button Group on the Left */}
        <div className="flex flex-col">
          <button
            type="button"
            onClick={handleIncrement}
            className="flex items-center justify-center w-6 h-4 bg-[#5A5BD8] hover:bg-[#4A4BC8] text-white transition-all duration-200 border-b border-[#4A4BC8]"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={handleDecrement}
            className="flex items-center justify-center w-6 h-4 bg-[#5A5BD8] hover:bg-[#4A4BC8] text-white transition-all duration-200"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
        
        {/* Input Field */}
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const newValue = parseInt(e.target.value) || min;
            if (newValue >= min && newValue <= max) {
              onChange(newValue);
            }
          }}
          min={min}
          max={max}
          step={step}
          className="w-12 px-2 py-1 text-center text-xs font-semibold text-slate-900 focus:outline-none border-0 bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>
    );
  };

  // Calculate pricing based on inputs
  const calculatePrice = useCallback((type: string, value: number) => {
    const tiers = pricingTiers[type as keyof typeof pricingTiers];
    if (type === 'analytics') return 0; // Handled separately
    
    for (const tier of tiers as Array<{min: number, max: number, price: number}>) {
      if (value >= tier.min && value <= tier.max) {
        return tier.price;
      }
    }
    return 0;
  }, [pricingTiers]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    let total = 0;
    
    // Bots pricing
    total += calculatorInputs.bots * calculatePrice('bots', calculatorInputs.bots);
    
    // Members pricing
    total += calculatorInputs.members * calculatePrice('members', calculatorInputs.members);
    
    // Conversations pricing (per 1k)
    const conversationTier = calculatePrice('conversations', calculatorInputs.conversations);
    total += Math.ceil(calculatorInputs.conversations / 1000) * conversationTier;
    
    // Storage pricing (per 50MB)
    const storageTier = calculatePrice('storage', calculatorInputs.storage);
    total += Math.ceil(calculatorInputs.storage / 50) * storageTier;
    
    // File size pricing (per 5MB)
    const fileSizeTier = calculatePrice('fileSize', calculatorInputs.fileSize);
    total += Math.ceil(calculatorInputs.fileSize / 5) * fileSizeTier;
    
    // Websites pricing
    total += calculatorInputs.websites * calculatePrice('websites', calculatorInputs.websites);
    
    // Parallel chats pricing (per 10)
    const parallelChatTier = calculatePrice('parallelChats', calculatorInputs.parallelChats);
    total += Math.ceil(calculatorInputs.parallelChats / 10) * parallelChatTier;
    
    // Analytics pricing
    total += pricingTiers.analytics[calculatorInputs.analytics as keyof typeof pricingTiers.analytics];
    
    return Math.round(total * 100) / 100; // Round to 2 decimal places
  }, [calculatorInputs, calculatePrice, pricingTiers]);

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
               <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-24">
                Choose the plan that fits your needs. All paid plans include a 14-day free trial.
              </p>
            </div>

            {/* Pricing cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-16">
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

            {/* Custom Pricing Calculator */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl p-6 md:p-8 shadow-2xl mb-16 border border-slate-200">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
                  <Calculator className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Custom Pricing Calculator</h2>
                <p className="text-base md:text-lg text-slate-600">Build your custom solution and get an instant estimate.</p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
                {/* Select Features Section */}
                <div className="lg:col-span-2 flex flex-col">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
                    Select Features
              </h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      Choose the features you need for your AI chatbot solution.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                    {/* Bots */}
                    <div 
                      className={`relative bg-white rounded-xl p-4 border-2 transition-all duration-300 cursor-pointer hover:shadow-[#5A5BD8] hover:shadow-3xl hover:-translate-y-2 group flex flex-col h-full ${
                      calculatorInputs.bots > 0 
                          ? 'border-blue-500 shadow-blue-100 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 ring-1 ring-blue-100' 
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-lg'
                      }`}
                      onClick={() => setCalculatorInputs(prev => ({ 
                        ...prev, 
                        bots: prev.bots > 0 ? 0 : 1 
                      }))}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                            calculatorInputs.bots > 0 
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-500' 
                              : 'border-slate-300 group-hover:border-slate-400 bg-slate-50'
                          }`}>
                            {calculatorInputs.bots > 0 && (
                              <Check className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">AI Bots</h4>
                            <p className="text-xs text-slate-500">Intelligent chatbots</p>
                        </div>
                      </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">
                            ${calculatePrice('bots', calculatorInputs.bots)}
                          </div>
                          <div className="text-xs text-slate-500">per bot</div>
                        </div>
                      </div>
                      <p className="text-slate-600 mb-3 leading-relaxed flex-1 text-xs">
                        Deploy intelligent chatbots for customer support and automated responses.
                      </p>
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
                        <label className="text-xs font-semibold text-slate-700">Quantity:</label>
                        <CustomCounter
                          value={calculatorInputs.bots}
                          onChange={(value) => setCalculatorInputs(prev => ({ ...prev, bots: value }))}
                          min={0}
                          max={100}
                          step={1}
                          className="focus-within:border-[#5A5BD8] focus-within:ring-2 focus-within:ring-[#5A5BD8]/20"
                        />
                      </div>
                    </div>

                    {/* Team Members */}
                    <div 
                      className={`relative bg-white rounded-xl p-4 border-2 transition-all duration-300 cursor-pointer hover:shadow-[#5A5BD8] hover:shadow-3xl hover:-translate-y-2 group flex flex-col h-full ${
                      calculatorInputs.members > 0 
                          ? 'border-blue-500 shadow-blue-100 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 ring-1 ring-blue-100' 
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-lg'
                      }`}
                      onClick={() => setCalculatorInputs(prev => ({ 
                        ...prev, 
                        members: prev.members > 0 ? 0 : 1 
                      }))}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                            calculatorInputs.members > 0 
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-500' 
                              : 'border-slate-300 group-hover:border-slate-400 bg-slate-50'
                          }`}>
                            {calculatorInputs.members > 0 && (
                              <Check className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">Team Members</h4>
                            <p className="text-xs text-slate-500">User accounts</p>
                        </div>
                      </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">
                            ${calculatePrice('members', calculatorInputs.members)}
                          </div>
                          <div className="text-xs text-slate-500">per member</div>
                        </div>
                      </div>
                      <p className="text-slate-600 mb-3 leading-relaxed flex-1 text-xs">
                        Add team members to collaborate on chatbot management and analytics.
                      </p>
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
                        <label className="text-xs font-semibold text-slate-700">Quantity:</label>
                        <CustomCounter
                          value={calculatorInputs.members}
                          onChange={(value) => setCalculatorInputs(prev => ({ ...prev, members: value }))}
                          min={0}
                          max={100}
                          step={1}
                          className="focus-within:border-[#5A5BD8] focus-within:ring-2 focus-within:ring-[#5A5BD8]/20"
                        />
                      </div>
                    </div>

                    {/* Conversations */}
                    <div 
                      className={`relative bg-white rounded-xl p-4 border-2 transition-all duration-300 cursor-pointer hover:shadow-[#5A5BD8] hover:shadow-3xl hover:-translate-y-2 group flex flex-col h-full ${
                      calculatorInputs.conversations > 0 
                          ? 'border-blue-500 shadow-blue-100 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 ring-1 ring-blue-100' 
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-lg'
                      }`}
                      onClick={() => setCalculatorInputs(prev => ({ 
                        ...prev, 
                        conversations: prev.conversations > 0 ? 0 : 1000 
                      }))}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                            calculatorInputs.conversations > 0 
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-500' 
                              : 'border-slate-300 group-hover:border-slate-400 bg-slate-50'
                          }`}>
                            {calculatorInputs.conversations > 0 && (
                              <Check className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">Conversations</h4>
                            <p className="text-xs text-slate-500">Monthly volume</p>
                        </div>
                      </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">
                            ${calculatePrice('conversations', calculatorInputs.conversations)}
                          </div>
                          <div className="text-xs text-slate-500">per 1k</div>
                        </div>
                      </div>
                      <p className="text-slate-600 mb-3 leading-relaxed flex-1 text-xs">
                        Handle high-volume customer conversations with scalable AI infrastructure.
                      </p>
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
                        <label className="text-xs font-semibold text-slate-700">Per month:</label>
                        <CustomCounter
                          value={calculatorInputs.conversations}
                          onChange={(value) => setCalculatorInputs(prev => ({ ...prev, conversations: value }))}
                          min={0}
                          max={100000}
                          step={1000}
                          className="focus-within:border-[#5A5BD8] focus-within:ring-2 focus-within:ring-[#5A5BD8]/20"
                        />
                      </div>
                    </div>

                    {/* Storage */}
                    <div 
                      className={`relative bg-white rounded-xl p-4 border-2 transition-all duration-300 cursor-pointer hover:shadow-[#5A5BD8] hover:shadow-3xl hover:-translate-y-2 group flex flex-col h-full ${
                      calculatorInputs.storage > 0 
                          ? 'border-blue-500 shadow-blue-100 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 ring-1 ring-blue-100' 
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-lg'
                      }`}
                      onClick={() => setCalculatorInputs(prev => ({ 
                        ...prev, 
                        storage: prev.storage > 0 ? 0 : 50 
                      }))}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                            calculatorInputs.storage > 0 
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-500' 
                              : 'border-slate-300 group-hover:border-slate-400 bg-slate-50'
                          }`}>
                            {calculatorInputs.storage > 0 && (
                              <Check className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">Storage</h4>
                            <p className="text-xs text-slate-500">File storage</p>
                        </div>
                      </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">
                            ${calculatePrice('storage', calculatorInputs.storage)}
                          </div>
                          <div className="text-xs text-slate-500">per 50MB</div>
                        </div>
                      </div>
                      <p className="text-slate-600 mb-3 leading-relaxed flex-1 text-xs">
                        Secure cloud storage for your chatbot knowledge base and documents.
                      </p>
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
                        <label className="text-xs font-semibold text-slate-700">MB:</label>
                        <CustomCounter
                          value={calculatorInputs.storage}
                          onChange={(value) => setCalculatorInputs(prev => ({ ...prev, storage: value }))}
                          min={0}
                          max={5000}
                          step={50}
                          className="focus-within:border-[#5A5BD8] focus-within:ring-2 focus-within:ring-[#5A5BD8]/20"
                        />
                      </div>
                    </div>

                    {/* Websites */}
                    <div 
                      className={`relative bg-white rounded-xl p-4 border-2 transition-all duration-300 cursor-pointer hover:shadow-[#5A5BD8] hover:shadow-3xl hover:-translate-y-2 group flex flex-col h-full ${
                      calculatorInputs.websites > 0 
                          ? 'border-blue-500 shadow-blue-100 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 ring-1 ring-blue-100' 
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-lg'
                      }`}
                      onClick={() => setCalculatorInputs(prev => ({ 
                        ...prev, 
                        websites: prev.websites > 0 ? 0 : 1 
                      }))}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                            calculatorInputs.websites > 0 
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-500' 
                              : 'border-slate-300 group-hover:border-slate-400 bg-slate-50'
                          }`}>
                            {calculatorInputs.websites > 0 && (
                              <Check className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">Websites</h4>
                            <p className="text-xs text-slate-500">Deployment locations</p>
                        </div>
                  </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">
                            ${calculatePrice('websites', calculatorInputs.websites)}
                          </div>
                          <div className="text-xs text-slate-500">per site</div>
                        </div>
                      </div>
                      <p className="text-slate-600 mb-3 leading-relaxed flex-1 text-xs">
                        Deploy your AI chatbots across multiple websites with easy integration.
                      </p>
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
                        <label className="text-xs font-semibold text-slate-700">Quantity:</label>
                        <CustomCounter
                          value={calculatorInputs.websites}
                          onChange={(value) => setCalculatorInputs(prev => ({ ...prev, websites: value }))}
                          min={0}
                          max={100}
                          step={1}
                          className="focus-within:border-[#5A5BD8] focus-within:ring-2 focus-within:ring-[#5A5BD8]/20"
                        />
                  </div>
                </div>

                    {/* Analytics */}
                    <div 
                      className={`relative bg-white rounded-xl p-4 border-2 transition-all duration-300 cursor-pointer hover:shadow-[#5A5BD8] hover:shadow-3xl hover:-translate-y-2 group flex flex-col h-full ${
                      calculatorInputs.analytics !== 'Basic' 
                          ? 'border-blue-500 shadow-blue-100 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 ring-1 ring-blue-100' 
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-lg'
                      }`}
                      onClick={() => setCalculatorInputs(prev => ({ 
                        ...prev, 
                        analytics: prev.analytics === 'Basic' ? 'Full' : 'Basic' 
                      }))}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${
                            calculatorInputs.analytics !== 'Basic' 
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-500' 
                              : 'border-slate-300 group-hover:border-slate-400 bg-slate-50'
                          }`}>
                            {calculatorInputs.analytics !== 'Basic' && (
                              <Check className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">Analytics</h4>
                            <p className="text-xs text-slate-500">Advanced reporting</p>
                        </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-blue-600">
                          ${pricingTiers.analytics[calculatorInputs.analytics as keyof typeof pricingTiers.analytics]}
                      </div>
                          <div className="text-xs text-slate-500">per month</div>
                        </div>
                      </div>
                      <p className="text-slate-600 mb-3 leading-relaxed flex-1 text-xs">
                        Get detailed insights into chatbot performance and user interactions.
                      </p>
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100">
                        <label className="text-xs font-semibold text-slate-700">Type:</label>
                        <select
                          value={calculatorInputs.analytics}
                          onChange={(e) => setCalculatorInputs(prev => ({ ...prev, analytics: e.target.value }))}
                          onClick={(e) => e.stopPropagation()}
                          className="px-2 py-1 border border-slate-200 rounded text-xs font-semibold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all duration-200"
                        >
                          <option value="Basic">Basic</option>
                          <option value="Full">Full</option>
                          <option value="Enterprise">Enterprise</option>
                        </select>
                      </div>
                  </div>
                  </div>
                </div>

                {/* Price Estimate Section */}
                <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-2xl p-6 md:p-8 border border-slate-700 shadow-2xl">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    Price Estimate
                  </h3>
                  
                  <div className="text-center mb-8">
                    <p className="text-slate-300 mb-6">Select features to see pricing</p>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                      <div className="text-center">
                        <div className="text-6xl font-bold text-white mb-2">
                          ${totalPrice.toFixed(0)}
                      </div>
                      <p className="text-slate-300 text-lg">per month</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 italic mt-4">
                      * Final price may vary based on detailed requirements.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5">
                      <Calculator className="w-5 h-5" />
                      Get Custom Quote
                    </button>
                    <button className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-6 rounded-xl border-2 border-white/30 hover:border-white/50 transition-all duration-300 flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 backdrop-blur-sm">
                      <Phone className="w-5 h-5" />
                      Discuss Pricing
                    </button>
                  </div>
                </div>
              </div>
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
