'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function IntegrationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bots, setBots] = useState([]);
  const [selectedBot, setSelectedBot] = useState(null);
  const [wpToken, setWpToken] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchUserBots();
    }
  }, [status]);

  const fetchUserBots = async () => {
    try {
      const response = await fetch('/api/user/bots');
      if (response.ok) {
        const data = await response.json();
        setBots(data.bots || []);
      }
    } catch (error) {
      console.error('Error fetching bots:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateWordPressToken = async (botId) => {
    // Generate a secure random token
    const secretKey = 'wp_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const token = `${session.user.id}:${botId}:${secretKey}`;

    // Save this token to database for validation
    try {
      const response = await fetch('/api/integrations/save-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ botId, token }),
      });

      if (response.ok) {
        setWpToken(token);
        setShowInstructions(true);
      } else {
        console.error('Failed to save token');
        alert('Failed to generate token. Please try again.');
      }
    } catch (error) {
      console.error('Error saving token:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPlugin = async () => {
    try {
      const response = await fetch('/api/download/wordpress-plugin');

      if (!response.ok) {
        throw new Error('Download failed');
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'synofex-chatbot.zip';
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download plugin. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
            <p className="mt-1 text-sm text-gray-600">
              Connect your chatbots to different platforms
            </p>
          </div>

          <div className="p-6">
            {/* WordPress Integration Section */}
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <img
                  src="/wordpress-logo.png"
                  alt="WordPress"
                  className="w-12 h-12 mr-3"
                  onError={(e) => { e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgNDAwIj48cGF0aCBmaWxsPSIjMjE3NTlhIiBkPSJNMCAwaDQwMHY0MDBIMHoiLz48cGF0aCBmaWxsPSIjZmZmIiBkPSJNNTAgMjAwYzAtODIuOCA2Ny4yLTE1MCAxNTAtMTUwczE1MCA2Ny4yIDE1MCAxNTAtNjcuMiAxNTAtMTUwIDE1MFM1MCAyODIuOCA1MCAyMDB6bTI3LjMgMGMwIDY3LjggNTUgMTIyLjcgMTIyLjcgMTIyLjdzMTIyLjctNTUgMTIyLjctMTIyLjdTMjY3LjggNzcuMyAyMDAgNzcuMyA3Ny4zIDEzMi4yIDc3LjMgMjAweiIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik0xMDQuNyAyMDQuN2wxOC40IDUwLjVMMTQxLjUgMjA1bDE4LjQgNTAuMiAxOC40LTUwLjVIMjA0bC0zNi44IDk1aC0yNS44bC0xOC4zLTQ3LjctMTguMyA0Ny43SDc5TDQyLjIgMjA0LjdoMjUuN2wxOC40IDUwLjUgMTguNC01MC41eiIvPjwvc3ZnPg=='; }}
                />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">WordPress Plugin</h2>
                  <p className="text-sm text-gray-600">Add AI chatbot to your WordPress website</p>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-4">Loading your bots...</div>
              ) : bots.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <p className="text-sm text-yellow-800">
                    You need to create a chatbot first before you can integrate it with WordPress.
                  </p>
                  <button
                    onClick={() => router.push('/dashboard/bots')}
                    className="mt-2 text-sm font-medium text-yellow-600 hover:text-yellow-500"
                  >
                    Create a Bot →
                  </button>
                </div>
              ) : (
                <>
                  {/* Bot Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select a Bot to Integrate
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => {
                        const bot = bots.find(b => b.id === e.target.value);
                        setSelectedBot(bot);
                        setShowInstructions(false);
                        setWpToken('');
                      }}
                      value={selectedBot?.id || ''}
                    >
                      <option value="">-- Select a bot --</option>
                      {bots.map((bot) => (
                        <option key={bot.id} value={bot.id}>
                          {bot.name} ({bot.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedBot && (
                    <div className="space-y-4">
                      {/* Bot Details */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-2">Bot Details</h3>
                        <dl className="text-sm space-y-1">
                          <div className="flex">
                            <dt className="font-medium text-gray-600 w-24">Name:</dt>
                            <dd className="text-gray-900">{selectedBot.name}</dd>
                          </div>
                          <div className="flex">
                            <dt className="font-medium text-gray-600 w-24">Model:</dt>
                            <dd className="text-gray-900">{selectedBot.model || 'gpt-3.5-turbo'}</dd>
                          </div>
                          <div className="flex">
                            <dt className="font-medium text-gray-600 w-24">Status:</dt>
                            <dd className="text-gray-900">
                              <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                selectedBot.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {selectedBot.status}
                              </span>
                            </dd>
                          </div>
                        </dl>
                      </div>

                      {/* Generate Token Button */}
                      {!showInstructions && (
                        <button
                          onClick={() => generateWordPressToken(selectedBot.id)}
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200"
                        >
                          Generate WordPress Integration Token
                        </button>
                      )}

                      {/* Installation Instructions */}
                      {showInstructions && (
                        <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            WordPress Installation Instructions
                          </h3>

                          {/* Token Display */}
                          <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Your Integration Token
                            </label>
                            <div className="flex">
                              <input
                                type="text"
                                value={wpToken}
                                readOnly
                                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-l-md font-mono text-sm"
                              />
                              <button
                                onClick={() => copyToClipboard(wpToken)}
                                className="px-4 py-2 bg-gray-700 text-white rounded-r-md hover:bg-gray-800 transition"
                              >
                                {copied ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                            <p className="mt-1 text-xs text-gray-600">
                              Keep this token secure. It provides access to your chatbot.
                            </p>
                          </div>

                          {/* Step by Step Instructions */}
                          <div className="space-y-4">
                            <h4 className="font-medium text-gray-900">Installation Steps:</h4>

                            <ol className="space-y-3 text-sm">
                              <li className="flex">
                                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mr-3">1</span>
                                <div>
                                  <strong>Download the Plugin</strong>
                                  <button
                                    onClick={downloadPlugin}
                                    className="ml-3 text-blue-600 hover:text-blue-500 underline"
                                  >
                                    Download synofex-chatbot.zip
                                  </button>
                                </div>
                              </li>

                              <li className="flex">
                                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mr-3">2</span>
                                <div>
                                  <strong>Install in WordPress</strong>
                                  <p className="text-gray-600 mt-1">
                                    Go to WordPress Admin → Plugins → Add New → Upload Plugin
                                  </p>
                                </div>
                              </li>

                              <li className="flex">
                                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mr-3">3</span>
                                <div>
                                  <strong>Activate the Plugin</strong>
                                  <p className="text-gray-600 mt-1">
                                    Click "Activate" after installation
                                  </p>
                                </div>
                              </li>

                              <li className="flex">
                                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mr-3">4</span>
                                <div>
                                  <strong>Configure Settings</strong>
                                  <p className="text-gray-600 mt-1">
                                    Go to Settings → Synofex Chatbot<br/>
                                    Paste your token and set API URL to: <code className="bg-gray-100 px-1">http://localhost:3000</code>
                                  </p>
                                </div>
                              </li>

                              <li className="flex">
                                <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs mr-3">✓</span>
                                <div>
                                  <strong>Done!</strong>
                                  <p className="text-gray-600 mt-1">
                                    The chat widget will appear on your WordPress site
                                  </p>
                                </div>
                              </li>
                            </ol>
                          </div>

                          {/* API URL Info */}
                          <div className="mt-6 p-4 bg-white rounded-md">
                            <h4 className="font-medium text-gray-900 mb-2">API Configuration</h4>
                            <div className="text-sm space-y-2">
                              <div>
                                <span className="font-medium">Development:</span>
                                <code className="ml-2 bg-gray-100 px-2 py-1 rounded">http://localhost:3000</code>
                              </div>
                              <div>
                                <span className="font-medium">Production:</span>
                                <code className="ml-2 bg-gray-100 px-2 py-1 rounded">https://your-domain.com</code>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Future Integrations */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Coming Soon</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* JavaScript Widget */}
                <div className="border border-gray-200 rounded-lg p-4 opacity-60">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">🌐</span>
                    <h4 className="font-medium">JavaScript Widget</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Embed on any website with a simple script tag
                  </p>
                  <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    Coming Soon
                  </span>
                </div>

                {/* Shopify */}
                <div className="border border-gray-200 rounded-lg p-4 opacity-60">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">🛍️</span>
                    <h4 className="font-medium">Shopify App</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Add chatbot to your Shopify store
                  </p>
                  <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    Coming Soon
                  </span>
                </div>

                {/* WhatsApp */}
                <div className="border border-gray-200 rounded-lg p-4 opacity-60">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-2">💬</span>
                    <h4 className="font-medium">WhatsApp</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Connect your bot to WhatsApp Business
                  </p>
                  <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}