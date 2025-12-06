'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Puzzle, X, Check, ChevronRight, Download, Copy, ExternalLink } from 'lucide-react';

interface Bot {
  id: string;
  name: string;
  status: string;
  model?: string;
}

interface Token {
  token: string;
  created_at: string;
  last_used?: string;
}

// App definitions
const apps = [
  {
    id: 'wordpress',
    name: 'WordPress',
    description: 'Add chatbot to your WordPress website with our official plugin',
    icon: '/wordpress-logo.png',
    fallbackIcon: '🌐',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    status: 'active'
  },
  {
    id: 'facebook',
    name: 'Facebook Messenger',
    description: 'Connect your bot to Facebook Messenger',
    icon: null,
    fallbackIcon: '📘',
    color: 'from-blue-600 to-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    status: 'coming_soon'
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    description: 'Integrate with WhatsApp Business API',
    icon: null,
    fallbackIcon: '💬',
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    status: 'coming_soon'
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Add your bot to Discord servers',
    icon: null,
    fallbackIcon: '🎮',
    color: 'from-indigo-500 to-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    status: 'coming_soon'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Connect to Instagram Direct Messages',
    icon: null,
    fallbackIcon: '📸',
    color: 'from-pink-500 to-purple-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    status: 'coming_soon'
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Deploy your bot on Telegram',
    icon: null,
    fallbackIcon: '✈️',
    color: 'from-sky-500 to-sky-600',
    bgColor: 'bg-sky-50',
    borderColor: 'border-sky-200',
    status: 'coming_soon'
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Add chatbot to your Shopify store',
    icon: null,
    fallbackIcon: '🛍️',
    color: 'from-green-600 to-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    status: 'coming_soon'
  },
  {
    id: 'custom-widget',
    name: 'Custom Widget',
    description: 'Embed on any website with JavaScript',
    icon: null,
    fallbackIcon: '🔧',
    color: 'from-gray-600 to-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    status: 'coming_soon'
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Add your bot to Slack workspaces',
    icon: null,
    fallbackIcon: '💼',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    status: 'coming_soon'
  }
];

export default function IntegrationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // WordPress connection modal state
  const [showWordPressModal, setShowWordPressModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [wpToken, setWpToken] = useState('');
  const [existingTokens, setExistingTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [generatingToken, setGeneratingToken] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchUserBots();
    }
  }, [status, router]);

  const fetchUserBots = async () => {
    try {
      const userRole = session?.user?.role;
      const endpoint = userRole === 'manager' ? '/api/manager/bots' : '/api/user/assigned-bots';
      const response = await fetch(endpoint);
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

  const fetchExistingTokens = async (botId: string) => {
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

  const generateWordPressToken = async () => {
    if (!selectedBot || !session?.user?.id) return;

    setGeneratingToken(true);
    const secretKey = 'wp_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const token = `${session.user.id}:${selectedBot.id}:${secretKey}`;

    try {
      const response = await fetch('/api/integrations/save-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId: selectedBot.id, token, deactivateOld: true }),
      });

      if (response.ok) {
        setWpToken(token);
        setCurrentStep(3);
        fetchExistingTokens(selectedBot.id);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to generate token. Please try again.');
      }
    } catch (error) {
      console.error('Error saving token:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setGeneratingToken(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadPlugin = async () => {
    try {
      const response = await fetch('/api/download/wordpress-plugin');
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'synofex-chatbot.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download plugin. Please try again.');
    }
  };

  const handleConnectClick = (appId: string) => {
    if (appId === 'wordpress') {
      setShowWordPressModal(true);
      setCurrentStep(1);
      setSelectedBot(null);
      setWpToken('');
      setExistingTokens([]);
    }
  };

  const handleBotSelect = (bot: Bot) => {
    setSelectedBot(bot);
    fetchExistingTokens(bot.id);
    setCurrentStep(2);
  };

  const closeModal = () => {
    setShowWordPressModal(false);
    setCurrentStep(1);
    setSelectedBot(null);
    setWpToken('');
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#6566F1] to-[#8B5CF6] flex items-center justify-center shadow-lg">
          <Puzzle className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
          <p className="text-sm text-gray-600">Connect your chatbots to different platforms</p>
        </div>
      </div>

      {/* Apps Grid - 9 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map((app) => (
          <Card
            key={app.id}
            className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${
              app.status === 'coming_soon' ? 'opacity-75' : ''
            }`}
          >
            <CardContent className="p-6">
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                {app.status === 'active' ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    <Check className="w-3 h-3 mr-1" />
                    Available
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-600 border-gray-200">
                    Coming Soon
                  </Badge>
                )}
              </div>

              {/* App Icon */}
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${app.color} flex items-center justify-center mb-4 shadow-md`}>
                {app.icon ? (
                  <img
                    src={app.icon}
                    alt={app.name}
                    className="w-8 h-8"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML = `<span class="text-2xl">${app.fallbackIcon}</span>`;
                    }}
                  />
                ) : (
                  <span className="text-2xl">{app.fallbackIcon}</span>
                )}
              </div>

              {/* App Info */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{app.name}</h3>
              <p className="text-sm text-gray-600 mb-4 min-h-[40px]">{app.description}</p>

              {/* Action Button */}
              {app.status === 'active' ? (
                <Button
                  onClick={() => handleConnectClick(app.id)}
                  className="w-full bg-[#6566F1] hover:bg-[#5A5BD9] text-white"
                >
                  Connect
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  disabled
                  className="w-full bg-gray-100 text-gray-400 cursor-not-allowed"
                >
                  Coming Soon
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* WordPress Connection Modal */}
      {showWordPressModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  <span className="text-xl">🌐</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Connect WordPress</h2>
                  <p className="text-sm text-gray-500">Follow the steps to integrate your chatbot</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Step Indicator */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between max-w-md mx-auto">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      currentStep >= step
                        ? 'bg-[#6566F1] text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {currentStep > step ? <Check className="w-4 h-4" /> : step}
                    </div>
                    <span className={`ml-2 text-sm font-medium ${
                      currentStep >= step ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {step === 1 ? 'Select Bot' : step === 2 ? 'Generate Token' : 'Install Plugin'}
                    </span>
                    {step < 3 && (
                      <div className={`w-12 h-0.5 mx-3 ${
                        currentStep > step ? 'bg-[#6566F1]' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Step 1: Bot Selection */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Select a Bot to Connect</h3>

                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6566F1] mx-auto mb-2"></div>
                      <p className="text-gray-500">Loading your bots...</p>
                    </div>
                  ) : bots.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                      <p className="text-yellow-800 mb-2">You need to create a chatbot first</p>
                      <Button
                        onClick={() => {
                          closeModal();
                          router.push('/manager-dashboard/bots');
                        }}
                        variant="outline"
                        className="text-yellow-700 border-yellow-300"
                      >
                        Create a Bot
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {bots.map((bot) => (
                        <button
                          key={bot.id}
                          onClick={() => handleBotSelect(bot)}
                          className="w-full p-4 border border-gray-200 rounded-xl hover:border-[#6566F1] hover:bg-[#6566F1]/5 transition-all text-left group"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900 group-hover:text-[#6566F1]">{bot.name}</h4>
                              <p className="text-sm text-gray-500">Model: {bot.model || 'gpt-3.5-turbo'}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={`${
                                bot.status === 'active'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {bot.status}
                              </Badge>
                              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#6566F1]" />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Token Generation */}
              {currentStep === 2 && selectedBot && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Selected Bot</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-900 font-medium">{selectedBot.name}</p>
                        <p className="text-sm text-gray-500">Model: {selectedBot.model || 'gpt-3.5-turbo'}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentStep(1)}
                      >
                        Change
                      </Button>
                    </div>
                  </div>

                  {/* Existing Token Display */}
                  {loadingTokens ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#6566F1] mx-auto"></div>
                    </div>
                  ) : existingTokens.length > 0 ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-green-800">Active Token Found</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard(existingTokens[0].token)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                        >
                          <Copy className="w-3 h-3" />
                          {copied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                      <code className="block text-xs bg-white p-2 rounded border border-green-200 break-all">
                        {existingTokens[0].token}
                      </code>
                      <p className="text-xs text-green-700 mt-2">
                        Created: {new Date(existingTokens[0].created_at).toLocaleDateString()}
                        {existingTokens[0].last_used && ` • Last used: ${new Date(existingTokens[0].last_used).toLocaleDateString()}`}
                      </p>
                    </div>
                  ) : null}

                  {/* Token Info */}
                  <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                    <div className="flex">
                      <div className="ml-3">
                        <p className="text-sm font-semibold text-amber-900 mb-1">1 Bot = 1 Site = 1 Token</p>
                        <ul className="text-sm text-amber-800 space-y-1">
                          <li>• Each bot can have only one active token</li>
                          <li>• Generating a new token will deactivate the old one</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Generate Button */}
                  <Button
                    onClick={generateWordPressToken}
                    disabled={generatingToken}
                    className="w-full py-6 text-base bg-[#6566F1] hover:bg-[#5A5BD9]"
                  >
                    {generatingToken ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : existingTokens.length > 0 ? (
                      'Regenerate Token & Continue'
                    ) : (
                      'Generate Token & Continue'
                    )}
                  </Button>

                  {existingTokens.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setWpToken(existingTokens[0].token);
                        setCurrentStep(3);
                      }}
                      className="w-full"
                    >
                      Use Existing Token & Continue
                    </Button>
                  )}
                </div>
              )}

              {/* Step 3: Plugin & Instructions */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  {/* Token Display */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-green-800">Your Integration Token</span>
                      <button
                        onClick={() => copyToClipboard(wpToken || existingTokens[0]?.token || '')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                      >
                        <Copy className="w-3 h-3" />
                        {copied ? 'Copied!' : 'Copy Token'}
                      </button>
                    </div>
                    <code className="block text-xs bg-white p-3 rounded border border-green-200 break-all font-mono">
                      {wpToken || existingTokens[0]?.token || ''}
                    </code>
                    <p className="text-xs text-green-700 mt-2">🔒 Keep this token secure</p>
                  </div>

                  {/* Download Plugin */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <h4 className="font-medium text-blue-900 mb-3">Download WordPress Plugin</h4>
                    <button
                      onClick={downloadPlugin}
                      className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                      <Download className="w-5 h-5" />
                      Download synofex-chatbot.zip
                    </button>
                  </div>

                  {/* Installation Instructions */}
                  <div className="border border-gray-200 rounded-xl p-5">
                    <h4 className="font-semibold text-gray-900 mb-4">Installation Steps</h4>
                    <ol className="space-y-4">
                      <li className="flex">
                        <span className="flex-shrink-0 w-7 h-7 bg-[#6566F1] text-white rounded-full flex items-center justify-center text-sm mr-3">1</span>
                        <div>
                          <strong className="text-gray-900">Upload Plugin</strong>
                          <p className="text-sm text-gray-600 mt-1">
                            Go to WordPress Admin → Plugins → Add New → Upload Plugin → Select the downloaded zip file
                          </p>
                        </div>
                      </li>
                      <li className="flex">
                        <span className="flex-shrink-0 w-7 h-7 bg-[#6566F1] text-white rounded-full flex items-center justify-center text-sm mr-3">2</span>
                        <div>
                          <strong className="text-gray-900">Activate Plugin</strong>
                          <p className="text-sm text-gray-600 mt-1">
                            Click &quot;Activate&quot; after installation completes
                          </p>
                        </div>
                      </li>
                      <li className="flex">
                        <span className="flex-shrink-0 w-7 h-7 bg-[#6566F1] text-white rounded-full flex items-center justify-center text-sm mr-3">3</span>
                        <div>
                          <strong className="text-gray-900">Configure Settings</strong>
                          <p className="text-sm text-gray-600 mt-1">
                            Go to Settings → Synofex Chatbot → Paste your token
                          </p>
                        </div>
                      </li>
                      <li className="flex">
                        <span className="flex-shrink-0 w-7 h-7 bg-[#6566F1] text-white rounded-full flex items-center justify-center text-sm mr-3">4</span>
                        <div>
                          <strong className="text-gray-900">Set API URL</strong>
                          <p className="text-sm text-gray-600 mt-1">
                            Enter API URL: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}</code>
                          </p>
                        </div>
                      </li>
                      <li className="flex">
                        <span className="flex-shrink-0 w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center text-sm mr-3">
                          <Check className="w-4 h-4" />
                        </span>
                        <div>
                          <strong className="text-gray-900">Done!</strong>
                          <p className="text-sm text-gray-600 mt-1">
                            The chatbot widget will appear on your WordPress site
                          </p>
                        </div>
                      </li>
                    </ol>
                  </div>

                  {/* Close Button */}
                  <Button
                    onClick={closeModal}
                    className="w-full bg-gray-900 hover:bg-gray-800"
                  >
                    Done
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
