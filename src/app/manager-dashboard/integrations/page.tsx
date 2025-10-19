'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Puzzle } from 'lucide-react';

export default function IntegrationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bots, setBots] = useState([]);
  const [selectedBot, setSelectedBot] = useState(null);
  const [wpToken, setWpToken] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [existingTokens, setExistingTokens] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchUserBots();
    }
  }, [status]);

  const fetchUserBots = async () => {
    try {
      // Check user role and fetch appropriate bots
      const userRole = session?.user?.role;
      const endpoint = userRole === 'manager'
        ? '/api/manager/bots'  // Managers see their created bots
        : '/api/user/assigned-bots';  // Regular users see assigned bots

      const response = await fetch(endpoint);
      console.log('Fetching from:', endpoint, 'Status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched bots data:', data);
        const fetchedBots = data.bots || [];
        setBots(fetchedBots);

        // Auto-select first bot (1 bot = 1 site model)
        if (fetchedBots.length > 0) {
          const firstBot = fetchedBots[0];
          setSelectedBot(firstBot);
          fetchExistingTokens(firstBot.id);
        }
      } else {
        console.error('Failed to fetch bots:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching bots:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingTokens = async (botId) => {
    setLoadingTokens(true);
    try {
      const response = await fetch(`/api/integrations/save-token?botId=${botId}`);
      if (response.ok) {
        const data = await response.json();
        setExistingTokens(data.tokens || []);
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setLoadingTokens(false);
    }
  };

  const generateWordPressToken = async (botId) => {
    // Check token limit (max 5 active tokens per bot)
    if (existingTokens.length >= 5) {
      alert('Maximum 5 active tokens allowed per bot. Please deactivate an old token first.');
      return;
    }

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
        // Refresh token list
        fetchExistingTokens(botId);
      } else {
        const data = await response.json();
        console.error('Failed to save token:', data);
        alert(data.error || 'Failed to generate token. Please try again.');
      }
    } catch (error) {
      console.error('Error saving token:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const deactivateToken = async (token) => {
    if (!confirm('Are you sure you want to deactivate this token? Sites using this token will stop working.')) {
      return;
    }

    try {
      const response = await fetch('/api/integrations/save-token', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        alert('Token deactivated successfully');
        // Refresh token list
        fetchExistingTokens(selectedBot.id);
      } else {
        alert('Failed to deactivate token');
      }
    } catch (error) {
      console.error('Error deactivating token:', error);
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
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
          <Puzzle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          <p className="text-sm text-gray-600">Connect your chatbots to different platforms</p>
        </div>
      </div>

      {/* WordPress Integration Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <img
              src="/wordpress-logo.png"
              alt="WordPress"
              className="w-10 h-10"
              onError={(e) => { e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgNDAwIj48cGF0aCBmaWxsPSIjMjE3NTlhIiBkPSJNMCAwaDQwMHY0MDBIMHoiLz48cGF0aCBmaWxsPSIjZmZmIiBkPSJNNTAgMjAwYzAtODIuOCA2Ny4yLTE1MCAxNTAtMTUwczE1MCA2Ny4yIDE1MCAxNTAtNjcuMiAxNTAtMTUwIDE1MFM1MCAyODIuOCA1MCAyMDB6bTI3LjMgMGMwIDY3LjggNTUgMTIyLjcgMTIyLjcgMTIyLjdzMTIyLjctNTUgMTIyLjctMTIyLjdTMjY3LjggNzcuMyAyMDAgNzcuMyA3Ny4zIDEzMi4yIDc3LjMgMjAweiIvPjxwYXRoIGZpbGw9IiNmZmYiIGQ9Ik0xMDQuNyAyMDQuN2wxOC40IDUwLjVMMTQxLjUgMjA1bDE4LjQgNTAuMiAxOC40LTUwLjVIMjA0bC0zNi44IDk1aC0yNS44bC0xOC4zLTQ3LjctMTguMyA0Ny43SDc5TDQyLjIgMjA0LjdoMjUuN2wxOC40IDUwLjUgMTguNC01MC41eiIvPjwvc3ZnPg=='; }}
            />
            <CardTitle>WordPress Plugin Integration</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">

              {loading ? (
                <div className="text-center py-4">Loading your bots...</div>
              ) : bots.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <p className="text-sm text-yellow-800">
                    You need to create a chatbot first before you can integrate it with WordPress.
                  </p>
                  <button
                    onClick={() => {
                      // Navigate to appropriate dashboard based on user role
                      const userRole = session?.user?.role;
                      const dashboardPath = userRole === 'manager' ? '/manager-dashboard/manager-bots' : '/dashboard/bots';
                      router.push(dashboardPath);
                    }}
                    className="mt-2 text-sm font-medium text-yellow-600 hover:text-yellow-500"
                  >
                    Create a Bot →
                  </button>
                </div>
              ) : (
                <>
                  {/* Bot Selection - Hidden for 1 bot = 1 site model, auto-selected on load */}

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

                      {/* Existing Tokens */}
                      <div className="border-2 border-blue-200 rounded-lg p-5 bg-blue-50/30">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-900">Active Integration Tokens</h3>
                          <span className="text-sm font-bold px-3 py-1 bg-blue-100 text-blue-800 rounded-full border border-blue-300">
                            {existingTokens.length}/5 Tokens
                          </span>
                        </div>

                        {loadingTokens ? (
                          <div className="text-center py-6 text-sm text-gray-600">
                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mb-2"></div>
                            <div>Loading tokens...</div>
                          </div>
                        ) : existingTokens.length === 0 ? (
                          <div className="text-center py-8 text-sm">
                            <div className="text-gray-400 mb-2">
                              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                              </svg>
                            </div>
                            <p className="text-gray-600 font-medium">No tokens generated yet</p>
                            <p className="text-gray-500 text-xs mt-1">Click the button below to generate your first integration token</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {existingTokens.map((tokenData, index) => (
                              <div key={index} className="bg-white border border-gray-300 rounded-lg p-4 space-y-3 shadow-sm">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-semibold text-gray-900">
                                      Token #{index + 1}
                                    </span>
                                    {tokenData.last_used ? (
                                      <Badge className="bg-green-100 text-green-800 border-green-300">
                                        ✓ Used
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-gray-100 text-gray-600 border-gray-300">
                                        Not Used
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => copyToClipboard(tokenData.token)}
                                      className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium"
                                    >
                                      Copy
                                    </button>
                                    <button
                                      onClick={() => deactivateToken(tokenData.token)}
                                      className="text-xs px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition font-medium"
                                    >
                                      Deactivate
                                    </button>
                                  </div>
                                </div>
                                <div className="flex gap-4 text-xs text-gray-600">
                                  <span className="font-medium">Created: {new Date(tokenData.created_at).toLocaleDateString()}</span>
                                  {tokenData.last_used && (
                                    <span className="font-medium">Last used: {new Date(tokenData.last_used).toLocaleDateString()}</span>
                                  )}
                                </div>
                                <div className="text-xs font-mono bg-gray-50 px-3 py-2 rounded border border-gray-200 break-all">
                                  {tokenData.token}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Download WordPress Plugin Button - Always Visible */}
                      {!showInstructions && (
                        <div className="mb-4">
                          <button
                            onClick={downloadPlugin}
                            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-semibold text-base flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Download WordPress Plugin (synofex-chatbot.zip)
                          </button>
                          <p className="text-xs text-center text-gray-600 mt-2">
                            Download the latest version of the WordPress plugin with all fixes
                          </p>
                        </div>
                      )}

                      {/* Generate Token Button */}
                      {!showInstructions && (
                        <div className="space-y-3">
                          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
                            <div className="flex">
                              <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-semibold text-amber-900 mb-1">
                                  📋 Token Management
                                </p>
                                <ul className="text-sm text-amber-800 space-y-1">
                                  <li>• Maximum 5 active tokens per bot</li>
                                  <li>• Each token can be used for a different website</li>
                                  <li>• All existing tokens are displayed above with their usage status</li>
                                  <li>• Deactivate old tokens to generate new ones if limit reached</li>
                                  <li>• Use existing tokens or generate a new one for different websites</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => generateWordPressToken(selectedBot.id)}
                            className="w-full py-6 text-base font-semibold"
                            variant="default"
                            disabled={existingTokens.length >= 5}
                          >
                            {existingTokens.length >= 5 ? '⚠️ Token Limit Reached (5/5)' : '+ Generate New Token'}
                          </Button>
                          {existingTokens.length >= 5 && (
                            <p className="text-xs text-center text-red-600 font-medium">
                              Deactivate an existing token above to generate a new one
                            </p>
                          )}
                        </div>
                      )}

                      {/* Installation Instructions */}
                      {showInstructions && (
                        <div className="border border-blue-200 rounded-lg p-6 bg-blue-50">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            WordPress Installation Instructions
                          </h3>

                          {/* Token Display */}
                          <div className="mb-6">
                            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded">
                              <div className="flex">
                                <div className="flex-shrink-0">
                                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-bold text-red-800">
                                    ⚠️ COPY AND SAVE THIS TOKEN NOW!
                                  </p>
                                  <p className="mt-1 text-sm text-red-700">
                                    This token is displayed only once. If you lose it, you'll need to generate a new one (which will invalidate this token).
                                  </p>
                                </div>
                              </div>
                            </div>
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
                            <p className="mt-2 text-xs text-gray-600 font-medium">
                              🔒 Keep this token secure. It provides access to your chatbot.
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
                                    Click &quot;Activate&quot; after installation
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
        </CardContent>
      </Card>
    </div>
  );
}