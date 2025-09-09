'use client'

import React, { useState, useEffect } from 'react'
import { useActiveAccount } from "thirdweb/react"
// Conditionally import settlement service (may not be available in demo mode)
let settlementService: any = null;
try {
  settlementService = require('../lib/settlement-service').settlementService;
} catch (e) {
  // Settlement service not available in demo mode
}
import { SUPPORTED_CHAINS, SUPPORTED_TOKENS } from '../lib/constants'

interface SettlementDashboardProps {
  streamerAddress?: string
}

export const SettlementDashboard: React.FC<SettlementDashboardProps> = ({
  streamerAddress
}) => {
  const account = useActiveAccount()
  const [settlements, setSettlements] = useState<any[]>([])
  const [pendingSettlements, setPendingSettlements] = useState<any>({})
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState<'pending' | 'history' | 'analytics'>('pending')

  const activeStreamerAddress = streamerAddress || account?.address

  useEffect(() => {
    if (!activeStreamerAddress) return

    loadDashboardData()
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadDashboardData, 30000)
    return () => clearInterval(interval)
  }, [activeStreamerAddress])

  const loadDashboardData = async () => {
    if (!activeStreamerAddress) return

    try {
      if (settlementService) {
        // Load settlement history
        const settlementHistory = settlementService.getStreamerSettlements(activeStreamerAddress)
        setSettlements(settlementHistory)

        // Load pending settlements
        const pending = settlementService.getPendingSettlementsTotal(activeStreamerAddress)
        setPendingSettlements(pending)

        // Load analytics
        const analyticsData = settlementService.getSettlementAnalytics(activeStreamerAddress)
        setAnalytics(analyticsData)
      } else {
        // Demo mode - set empty data
        setSettlements([])
        setPendingSettlements({})
        setAnalytics({
          totalVolume: 0,
          totalTips: 0,
          averageTip: 0,
          topTokens: [],
          recentTips: []
        })
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleManualSettle = async (chainId?: number, token?: string) => {
    if (!activeStreamerAddress) return

    try {
      setLoading(true)
      await settlementService.manualSettle(activeStreamerAddress, chainId, token)
      await loadDashboardData()
    } catch (error) {
      console.error('Manual settlement failed:', error)
      alert('Settlement failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (amount: string, decimals: number = 6) => {
    const num = parseFloat(amount)
    return num.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: Math.min(decimals, 6) 
    })
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'failed': return 'text-red-600 bg-red-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'batching': return 'text-blue-600 bg-blue-100'
      case 'converting': return 'text-purple-600 bg-purple-100'
      case 'bridging': return 'text-indigo-600 bg-indigo-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getChainName = (chainId: number) => {
    return Object.values(SUPPORTED_CHAINS).find(c => c.id === chainId)?.name || 'Unknown'
  }

  const getTokenSymbol = (tokenAddress: string, chainId: number) => {
    return SUPPORTED_TOKENS[chainId]?.find(t => t.address === tokenAddress)?.symbol || 'Unknown'
  }

  if (!activeStreamerAddress) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">👛</div>
          <div className="text-gray-700">Please connect your wallet to view settlement dashboard</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">Settlement Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track your cross-chain tip settlements to ApeChain USDC
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'pending', label: 'Pending Settlements', icon: '⏳' },
              { id: 'history', label: 'Settlement History', icon: '📋' },
              { id: 'analytics', label: 'Analytics', icon: '📊' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading && (
            <div className="text-center py-8">
              <div className="text-blue-600 mb-2">⏳</div>
              <div className="text-gray-600">Loading settlement data...</div>
            </div>
          )}

          {/* Pending Settlements Tab */}
          {selectedTab === 'pending' && !loading && (
            <div>
              {Object.keys(pendingSettlements).length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2 text-2xl">✅</div>
                  <div className="text-gray-600">No pending settlements</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Tips will appear here when they're queued for settlement
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(pendingSettlements).map(([chainId, tokens]: [string, any]) => (
                    <div key={chainId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900">
                          {getChainName(parseInt(chainId))} Settlements
                        </h3>
                        <button
                          onClick={() => handleManualSettle(parseInt(chainId))}
                          className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200"
                        >
                          Settle Now
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        {Object.entries(tokens).map(([tokenAddr, info]: [string, any]) => (
                          <div key={tokenAddr} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                            <div>
                              <div className="font-medium text-gray-900">
                                {formatAmount(info.amount)} {getTokenSymbol(tokenAddr, parseInt(chainId))}
                              </div>
                              <div className="text-sm text-gray-500">
                                {info.count} tip{info.count !== 1 ? 's' : ''} waiting for batch
                              </div>
                            </div>
                            <button
                              onClick={() => handleManualSettle(parseInt(chainId), tokenAddr)}
                              className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800"
                            >
                              Settle →
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settlement History Tab */}
          {selectedTab === 'history' && !loading && (
            <div>
              {settlements.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2 text-2xl">📋</div>
                  <div className="text-gray-600">No settlement history</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Completed settlements will appear here
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {settlements.map((settlement) => (
                    <div key={settlement.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(settlement.status)}`}>
                            {settlement.status.charAt(0).toUpperCase() + settlement.status.slice(1)}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatAmount(settlement.totalAmount)} {getTokenSymbol(settlement.token, settlement.chain)}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatTime(settlement.timestamp)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Chain:</span>
                          <span className="ml-2 font-medium">{getChainName(settlement.chain)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Tips:</span>
                          <span className="ml-2 font-medium">{settlement.tipIds.length}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Settlement ID:</span>
                          <span className="ml-2 font-mono text-xs">{settlement.id.slice(-8)}</span>
                        </div>
                      </div>

                      {settlement.txHash && (
                        <div className="mt-2 text-sm">
                          <span className="text-gray-500">TX Hash:</span>
                          <span className="ml-2 font-mono text-xs text-blue-600">{settlement.txHash}</span>
                        </div>
                      )}

                      {settlement.errorMessage && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-700">
                          Error: {settlement.errorMessage}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {selectedTab === 'analytics' && !loading && analytics && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{analytics.totalProcessed}</div>
                  <div className="text-sm text-blue-800">Settlements Completed</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">${formatAmount(analytics.totalVolume)}</div>
                  <div className="text-sm text-green-800">Total Volume Settled</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{analytics.successRate.toFixed(1)}%</div>
                  <div className="text-sm text-purple-800">Success Rate</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(analytics.averageSettlementTime / 1000 / 60)}m
                  </div>
                  <div className="text-sm text-orange-800">Avg Settlement Time</div>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-2">
                  {analytics.recentActivity.map((activity: any) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 border border-gray-200 rounded">
                      <div className="flex items-center space-x-3">
                        <span className={`w-2 h-2 rounded-full ${
                          activity.status === 'completed' ? 'bg-green-400' :
                          activity.status === 'failed' ? 'bg-red-400' : 'bg-yellow-400'
                        }`}></span>
                        <span className="text-sm font-medium">
                          {formatAmount(activity.totalAmount)} {getTokenSymbol(activity.token, activity.chain)}
                        </span>
                        <span className="text-sm text-gray-500">
                          on {getChainName(activity.chain)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatTime(activity.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}