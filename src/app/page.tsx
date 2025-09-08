'use client'

import { ConnectButton } from "thirdweb/react";
import { client, wallets, inAppWallet } from "../lib/thirdweb";
import { TippingWidget } from "../components/TippingWidget";
import { SettlementDashboard } from "../components/SettlementDashboard";
import { SUPPORTED_CHAINS } from "../lib/constants";
import { useState } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<'demo' | 'dashboard'>('demo');
  
  const handleTipSent = (tipData: any) => {
    console.log('Tip sent:', tipData);
    // Here you would typically:
    // 1. Show success notification
    // 2. Update UI with tip data
    // 3. Trigger bridge process to ApeChain
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <header className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                StreamTip
              </h1>
              <p className="text-gray-600">
                Cross-chain tipping with ApeChain USDC settlement
              </p>
            </div>
            <ConnectButton
              client={client}
              wallets={[...wallets, inAppWallet]}
              chains={Object.values(SUPPORTED_CHAINS)}
              connectModal={{
                title: "Connect to StreamTip",
                titleIcon: "🎯",
              }}
            />
          </header>

          {/* Navigation Tabs */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('demo')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'demo'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  🎯 Tipping Demo
                </button>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'dashboard'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  📊 Settlement Dashboard
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'demo' && (
            <div className="grid lg:grid-cols-2 gap-8 animate-fade-in">
              {/* Demo Section */}
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    How it works
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        1
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Connect Wallet</h3>
                        <p className="text-sm text-gray-600">
                          Connect any wallet on Ethereum, Polygon, or Base
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        2
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Choose Amount & Token</h3>
                        <p className="text-sm text-gray-600">
                          Tip in ETH, USDC, MATIC, or other supported tokens
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        3
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Automatic Settlement</h3>
                        <p className="text-sm text-gray-600">
                          Tips are automatically converted to USDC on ApeChain
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                        4
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Revenue Split</h3>
                        <p className="text-sm text-gray-600">
                          5% platform fee, then 70% business / 30% streamer
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Platform Features */}
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Platform Features
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="text-green-500">✅</div>
                      <span className="text-sm">Multi-chain support (Ethereum, Polygon, Base)</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-green-500">✅</div>
                      <span className="text-sm">Automatic USDC settlement on ApeChain</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-green-500">✅</div>
                      <span className="text-sm">Real-time tip notifications</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-green-500">✅</div>
                      <span className="text-sm">Gas-optimized batch processing</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-green-500">✅</div>
                      <span className="text-sm">Settlement tracking dashboard</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tipping Widget Demo */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Demo Tipping Widget
                </h2>
                
                <TippingWidget
                  streamerAddress="0x1234567890123456789012345678901234567890" // Demo address
                  streamerUsername="DemoStreamer"
                  onTipSent={handleTipSent}
                />
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-yellow-600">⚠️</div>
                    <div>
                      <h3 className="font-medium text-yellow-800">Demo Mode</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        This is a demo. Real tips require deployed contracts and proper streamer registration.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="animate-fade-in">
              <SettlementDashboard />
            </div>
          )}

          {/* Footer */}
          <footer className="mt-16 text-center text-gray-600">
            <p className="text-sm">
              Built with thirdweb • Cross-chain tipping solution
            </p>
          </footer>
        </div>
      </div>
  );
}