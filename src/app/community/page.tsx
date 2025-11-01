import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, MessageSquare, BookOpen, Award } from 'lucide-react';

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-[#6566F1] hover:text-[#5A5BD9] mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Community</h1>
          <p className="text-xl text-gray-600">
            Join our community of developers, creators, and AI enthusiasts.
          </p>
        </div>

        {/* Community Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <Users className="w-8 h-8 text-[#6566F1] mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Discussion Forum</h3>
            <p className="text-gray-600 mb-4">
              Ask questions, share tips, and connect with other users.
            </p>
            <button className="text-[#6566F1] hover:text-[#5A5BD9] font-medium">
              Visit Forum →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <MessageSquare className="w-8 h-8 text-[#6566F1] mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Discord Community</h3>
            <p className="text-gray-600 mb-4">
              Join our Discord server for real-time discussions and support.
            </p>
            <button className="text-[#6566F1] hover:text-[#5A5BD9] font-medium">
              Join Discord →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <BookOpen className="w-8 h-8 text-[#6566F1] mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Blog & Tutorials</h3>
            <p className="text-gray-600 mb-4">
              Read the latest articles, guides, and best practices.
            </p>
            <button className="text-[#6566F1] hover:text-[#5A5BD9] font-medium">
              Read Blog →
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <Award className="w-8 h-8 text-[#6566F1] mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Showcase</h3>
            <p className="text-gray-600 mb-4">
              Share your chatbot projects and get featured.
            </p>
            <button className="text-[#6566F1] hover:text-[#5A5BD9] font-medium">
              View Showcase →
            </button>
          </div>
        </div>

        {/* Community Stats */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Community Stats</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-[#6566F1] mb-2">5,000+</p>
              <p className="text-gray-600">Active Members</p>
            </div>

            <div className="text-center">
              <p className="text-3xl font-bold text-[#6566F1] mb-2">1,200+</p>
              <p className="text-gray-600">Discussions</p>
            </div>

            <div className="text-center">
              <p className="text-3xl font-bold text-[#6566F1] mb-2">500+</p>
              <p className="text-gray-600">Projects Shared</p>
            </div>
          </div>
        </div>

        {/* Guidelines */}
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Community Guidelines</h2>

          <ul className="space-y-4 text-gray-600">
            <li className="flex items-start">
              <span className="text-[#6566F1] mr-2">✓</span>
              <span>Be respectful and constructive in all interactions</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#6566F1] mr-2">✓</span>
              <span>Share knowledge and help others learn</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#6566F1] mr-2">✓</span>
              <span>Give credit when sharing others' work</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#6566F1] mr-2">✓</span>
              <span>Report spam, abuse, or inappropriate content</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#6566F1] mr-2">✓</span>
              <span>Follow the code of conduct in all community spaces</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
