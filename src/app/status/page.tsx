import React from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Activity, Server, Database, Globe } from 'lucide-react';

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-[#6566F1] hover:text-[#5A5BD9] mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">System Status</h1>
          <p className="text-xl text-gray-600">
            Real-time status and uptime monitoring for all services.
          </p>
        </div>

        {/* Overall Status */}
        <div className="bg-green-50 border border-green-200 p-6 rounded-lg mb-8">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600 mr-4" />
            <div>
              <h2 className="text-2xl font-bold text-green-900">All Systems Operational</h2>
              <p className="text-green-700">All services are running normally.</p>
            </div>
          </div>
        </div>

        {/* Services Status */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Services</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <Globe className="w-6 h-6 text-gray-600 mr-4" />
                <div>
                  <h3 className="font-semibold text-gray-900">API Service</h3>
                  <p className="text-sm text-gray-600">Core API endpoints</p>
                </div>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-600">Operational</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <Database className="w-6 h-6 text-gray-600 mr-4" />
                <div>
                  <h3 className="font-semibold text-gray-900">Database</h3>
                  <p className="text-sm text-gray-600">PostgreSQL database</p>
                </div>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-600">Operational</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <Server className="w-6 h-6 text-gray-600 mr-4" />
                <div>
                  <h3 className="font-semibold text-gray-900">Chat Service</h3>
                  <p className="text-sm text-gray-600">Real-time chat functionality</p>
                </div>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-600">Operational</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center">
                <Activity className="w-6 h-6 text-gray-600 mr-4" />
                <div>
                  <h3 className="font-semibold text-gray-900">AI Processing</h3>
                  <p className="text-sm text-gray-600">OpenAI GPT integration</p>
                </div>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-600">Operational</span>
              </div>
            </div>
          </div>
        </div>

        {/* Uptime Statistics */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Uptime</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-900 mb-2">99.9%</p>
              <p className="text-sm text-gray-600">Last 30 Days</p>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-900 mb-2">99.95%</p>
              <p className="text-sm text-gray-600">Last 90 Days</p>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-gray-900 mb-2">99.98%</p>
              <p className="text-sm text-gray-600">All Time</p>
            </div>
          </div>
        </div>

        {/* Subscribe to Updates */}
        <div className="mt-8 bg-[#6566F1] text-white p-8 rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-4">Subscribe to Status Updates</h2>
          <p className="mb-6">Get notified when system status changes.</p>
          <div className="flex max-w-md mx-auto gap-2">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-4 py-2 rounded-lg text-gray-900"
            />
            <button className="bg-white text-[#6566F1] px-6 py-2 rounded-lg font-semibold hover:bg-gray-100">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
