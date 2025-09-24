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
        "Unlimited Links",
        "Default Templates Only",
        "1 Parallel Chat at a time"
      ],
      limitations: [
        "No Customize Branding",
        "No API / Integrations",
        "No Analytics"
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
        "Unlimited Links",
        "10 Parallel Chats at a time",
        "Default Templates",
        "Limited Analytics Dashboard",
        "Email Support"
      ],
      limitations: [
        "No Customize Branding"
      ],
      cta: "Start Free Trial",
      popular: false,
      highlight: false
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
        "Unlimited Links",
        "25 Parallel Chats at a time",
        "Default + Custom Templates",
        "Customize Branding (Colors, Logo, Theme)",
        "API Access + Integrations",
        "Priority Email & Chat Support",
        "Full Analytics Dashboard"
      ],
      limitations: [],
      cta: "Start Free Trial",
      popular: true,
      highlight: true
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
      limitations: [],
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
              <div className="flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-blue-600 mr-2" />
                <span className="text-blue-600 font-medium">Pricing Plans</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
                Simple, Transparent{" "}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Pricing
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Choose the plan that fits your needs. All paid plans include a 14-day free trial.
              </p>
            </div>

            {/* Pricing cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {plans.map((plan, index) => (
                <div
                  key={index}
                  className={`relative bg-white border rounded-2xl p-8 shadow-lg transition-all duration-300 hover:shadow-xl flex flex-col ${
                    plan.popular
                      ? "border-blue-600 shadow-blue-600/10"
                      : "border-slate-200 hover:border-blue-600/50"
                  } ${plan.highlight ? "ring-2 ring-blue-600/20" : ""}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg whitespace-nowrap">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-slate-600 mb-6">
                      {plan.description}
                    </p>
                    <div className="flex items-baseline justify-center mb-6">
                      <span className="text-5xl font-bold text-slate-900">
                        {plan.price}
                      </span>
                      <span className="text-slate-600 ml-2 text-lg">
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
                    {plan.limitations && plan.limitations.length > 0 && (
                      <>
                        {plan.limitations.map((limitation, limitationIndex) => (
                          <li key={`limitation-${limitationIndex}`} className="flex items-start">
                            <span className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0 text-center text-lg leading-none">×</span>
                            <span className="text-slate-400 text-sm line-through">{limitation}</span>
                          </li>
                        ))}
                      </>
                    )}
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

            {/* Add-ons Section */}
            <div className="bg-white rounded-2xl p-8 shadow-lg mb-12">
              <h3 className="text-2xl font-bold text-center mb-8 text-slate-900">
                Optional Add-ons
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center space-y-3 p-4 border border-slate-200 rounded-lg">
                  <div className="w-12 h-12 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">💬</span>
                  </div>
                  <h4 className="font-semibold text-slate-900">Extra Conversations</h4>
                  <p className="text-sm text-slate-600 mb-2">
                    Add more conversations to your plan
                  </p>
                  <div className="text-lg font-bold text-blue-600">
                    $10 for +5,000 conversations
                  </div>
                </div>
                <div className="text-center space-y-3 p-4 border border-slate-200 rounded-lg">
                  <div className="w-12 h-12 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <h4 className="font-semibold text-slate-900">Extra Bot Seats</h4>
                  <p className="text-sm text-slate-600 mb-2">
                    Add more bots to your plan
                  </p>
                  <div className="text-lg font-bold text-blue-600">
                    $5 per additional bot
                  </div>
                </div>
                <div className="text-center space-y-3 p-4 border border-slate-200 rounded-lg">
                  <div className="w-12 h-12 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-2xl">🏠</span>
                  </div>
                  <h4 className="font-semibold text-slate-900">Dedicated Hosting</h4>
                  <p className="text-sm text-slate-600 mb-2">
                    Get your own dedicated server
                  </p>
                  <div className="text-lg font-bold text-blue-600">
                    +$100 / month
                  </div>
                </div>
              </div>
            </div>

            {/* Features comparison */}
            <div className="bg-white rounded-2xl p-8 shadow-lg mb-12">
              <h3 className="text-2xl font-bold text-center mb-8 text-slate-900">
                All plans include our core features
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-slate-900">AI-Powered</h4>
                  <p className="text-sm text-slate-600">
                    Advanced AI technology for natural conversations
                  </p>
                </div>
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-slate-900">Easy Integration</h4>
                  <p className="text-sm text-slate-600">
                    Simple setup with popular platforms and websites
                  </p>
                </div>
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold text-slate-900">24/7 Available</h4>
                  <p className="text-sm text-slate-600">
                    Your chatbot works around the clock for your customers
                  </p>
                </div>
              </div>
            </div>

            {/* FAQ and contact */}
            <div className="text-center space-y-6">
              <h3 className="text-2xl font-semibold text-slate-900">
                Questions about pricing?
              </h3>
              <p className="text-lg text-slate-600 mb-6">
                We&apos;re here to help you choose the right plan for your business.
              </p>
              <div className="flex justify-center">
                <button 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
                  onClick={() => window.location.href = '/contact'}
                >
                  Contact Sales
                </button>
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
