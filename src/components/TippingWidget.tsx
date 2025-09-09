'use client'

import React, { useState, useEffect } from 'react'
import { useActiveAccount, useActiveWallet } from "thirdweb/react"
import { prepareContractCall, sendTransaction } from "thirdweb"
import { getContract } from "thirdweb"
import { client } from '../lib/thirdweb'
import { SUPPORTED_CHAINS, SUPPORTED_TOKENS, TIP_AMOUNTS, CONTRACTS } from '../lib/constants'
// Conditionally import settlement service (may not be available in demo mode)
let settlementService: any = null;
try {
  settlementService = require('../lib/settlement-service').settlementService;
} catch (e) {
  // Settlement service not available in demo mode
}

interface TippingWidgetProps {
  streamerAddress: string
  streamerUsername?: string
  onTipSent?: (tipData: any) => void
}

export const TippingWidget: React.FC<TippingWidgetProps> = ({
  streamerAddress,
  streamerUsername,
  onTipSent
}) => {
  const account = useActiveAccount()
  const wallet = useActiveWallet()
  
  const [selectedChain, setSelectedChain] = useState(SUPPORTED_CHAINS.ETHEREUM)
  const [selectedToken, setSelectedToken] = useState(SUPPORTED_TOKENS[SUPPORTED_CHAINS.ETHEREUM.id][0])
  const [selectedAmount, setSelectedAmount] = useState(TIP_AMOUNTS[1]) // $5 default
  const [customAmount, setCustomAmount] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [settlementInfo, setSettlementInfo] = useState<any>(null)
  const [pendingSettlements, setPendingSettlements] = useState<any>({})

  const tippingContract = getContract({
    client,
    chain: selectedChain,
    address: CONTRACTS.TIPPING_CONTRACT
  })

  const handleChainChange = (chainId: number) => {
    const chain = Object.values(SUPPORTED_CHAINS).find(c => c.id === chainId)
    if (chain) {
      setSelectedChain(chain)
      setSelectedToken(SUPPORTED_TOKENS[chainId][0])
    }
  }

  const calculateTipAmount = () => {
    const usdAmount = customAmount ? parseFloat(customAmount) : selectedAmount.usd
    // This would typically use a price oracle or API to convert USD to token amount
    // For now, using approximate conversions
    if (selectedToken.symbol === 'USDC' || selectedToken.symbol === 'USDT') {
      return (usdAmount * Math.pow(10, selectedToken.decimals)).toString()
    }
    // For ETH/MATIC, approximate conversion (would use real price in production)
    const ethPrice = 2000 // $2000 per ETH (would be dynamic)
    const tokenAmount = usdAmount / ethPrice
    return (tokenAmount * Math.pow(10, selectedToken.decimals)).toString()
  }

  const handleTip = async () => {
    // Check if contracts are deployed
    if (CONTRACTS.TIPPING_CONTRACT === '0x0000000000000000000000000000000000000000') {
      alert('🎯 Demo Mode: Smart contracts not yet deployed. This is a UI demonstration.')
      setTxStatus('success')
      setSettlementInfo({
        id: 'demo_settlement_' + Date.now(),
        estimatedTime: '15-30 minutes',
        status: 'pending'
      })
      updatePendingSettlements()
      return
    }

    if (!account || !wallet) {
      alert('Please connect your wallet')
      return
    }

    if (!streamerAddress) {
      alert('Streamer address required')
      return
    }

    setIsLoading(true)
    setTxStatus('pending')

    try {
      const tipAmount = calculateTipAmount()
      
      // Prepare the tip transaction
      const transaction = prepareContractCall({
        contract: tippingContract,
        method: "function tip(address streamer, address token, uint256 amount, string memory message) payable",
        params: [
          streamerAddress,
          selectedToken.address,
          BigInt(tipAmount),
          message || ""
        ],
        value: selectedToken.address === '0x0000000000000000000000000000000000000000' ? BigInt(tipAmount) : BigInt(0)
      })

      // Send transaction
      const result = await sendTransaction({
        transaction,
        account
      })

      console.log('Transaction sent:', result.transactionHash)
      
      setTxStatus('success')

      // Process tip for settlement (if service is available)
      try {
        let settlementId = 'demo_settlement_' + Date.now();
        if (settlementService) {
          settlementId = await settlementService.processTipForSettlement(
            result.transactionHash,
            streamerAddress,
            account.address, // business wallet for now - should be from registry
            selectedToken.address,
            tipAmount,
            selectedChain.id,
            message
          );
        }
        
        setSettlementInfo({
          id: settlementId,
          estimatedTime: '15-30 minutes',
          status: 'pending'
        })
        
        // Update pending settlements display
        updatePendingSettlements()
        
      } catch (settlementError) {
        console.error('Settlement processing error:', settlementError)
        // Tip succeeded but settlement failed - show warning
      }
      
      // Callback with tip data
      if (onTipSent) {
        onTipSent({
          txHash: result.transactionHash,
          streamer: streamerAddress,
          amount: tipAmount,
          token: selectedToken,
          message,
          timestamp: Date.now(),
          settlementId: settlementInfo?.id
        })
      }

      // Reset form
      setMessage('')
      setCustomAmount('')

    } catch (error) {
      console.error('Tip failed:', error)
      setTxStatus('error')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDisplayAmount = () => {
    const usdAmount = customAmount ? parseFloat(customAmount) : selectedAmount.usd
    return `$${usdAmount.toFixed(2)}`
  }

  const updatePendingSettlements = () => {
    if (settlementService) {
      const pending = settlementService.getPendingSettlementsTotal(streamerAddress)
      setPendingSettlements(pending)
    } else {
      setPendingSettlements({})
    }
  }

  // Update pending settlements on component mount and chain change
  useEffect(() => {
    updatePendingSettlements()
    
    // Refresh pending settlements every 30 seconds
    const interval = setInterval(updatePendingSettlements, 30000)
    return () => clearInterval(interval)
  }, [streamerAddress])

  // Update selected token when chain changes
  useEffect(() => {
    if (SUPPORTED_TOKENS[selectedChain.id]?.length > 0) {
      setSelectedToken(SUPPORTED_TOKENS[selectedChain.id][0])
    }
  }, [selectedChain])

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Tip {streamerUsername || 'Streamer'}
        </h3>
        <p className="text-sm text-gray-600">
          Support with crypto, settled in USDC on ApeChain
        </p>
      </div>

      {/* Chain Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Network
        </label>
        <select
          value={selectedChain.id}
          onChange={(e) => handleChainChange(Number(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {Object.values(SUPPORTED_CHAINS).map((chain) => (
            <option key={chain.id} value={chain.id}>
              {chain.name}
            </option>
          ))}
        </select>
      </div>

      {/* Token Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pay with
        </label>
        <select
          value={selectedToken.address}
          onChange={(e) => {
            const token = SUPPORTED_TOKENS[selectedChain.id].find(t => t.address === e.target.value)
            if (token) setSelectedToken(token)
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {SUPPORTED_TOKENS[selectedChain.id]?.map((token) => (
            <option key={token.address} value={token.address}>
              {token.symbol} - {token.name}
            </option>
          ))}
        </select>
      </div>

      {/* Amount Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Amount
        </label>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {TIP_AMOUNTS.map((amount) => (
            <button
              key={amount.value}
              onClick={() => {
                setSelectedAmount(amount)
                setCustomAmount('')
              }}
              className={`px-3 py-2 text-sm font-medium rounded-md border ${
                selectedAmount.value === amount.value && !customAmount
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {amount.label}
            </button>
          ))}
        </div>
        
        <input
          type="number"
          placeholder="Custom amount (USD)"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Message */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Message (optional)
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Say something nice..."
          rows={3}
          maxLength={200}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <div className="text-xs text-gray-500 mt-1">
          {message.length}/200 characters
        </div>
      </div>

      {/* Fee Breakdown */}
      <div className="mb-4 p-3 bg-gray-50 rounded-md text-sm">
        <div className="font-medium text-gray-700 mb-1">Fee Breakdown:</div>
        <div className="text-gray-600">
          <div>Tip Amount: {formatDisplayAmount()}</div>
          <div>Platform Fee (5%): ${((customAmount ? parseFloat(customAmount) : selectedAmount.usd) * 0.05).toFixed(2)}</div>
          <div>To Business (70%): ${((customAmount ? parseFloat(customAmount) : selectedAmount.usd) * 0.95 * 0.7).toFixed(2)}</div>
          <div>To Streamer (30%): ${((customAmount ? parseFloat(customAmount) : selectedAmount.usd) * 0.95 * 0.3).toFixed(2)}</div>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-xs text-blue-600 font-medium">
            💰 Auto-settled to USDC on ApeChain within 15-30 minutes
          </div>
        </div>
      </div>

      {/* Pending Settlements Info */}
      {Object.keys(pendingSettlements).length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md text-sm">
          <div className="font-medium text-blue-700 mb-2">⏳ Pending Settlements:</div>
          {Object.entries(pendingSettlements).map(([chainId, tokens]: [string, any]) => {
            const chainName = Object.values(SUPPORTED_CHAINS).find(c => c.id === parseInt(chainId))?.name || 'Unknown'
            return (
              <div key={chainId} className="text-blue-600 mb-1">
                <div className="font-medium">{chainName}:</div>
                {Object.entries(tokens).map(([tokenAddr, info]: [string, any]) => {
                  const token = SUPPORTED_TOKENS[parseInt(chainId)]?.find(t => t.address === tokenAddr)
                  return (
                    <div key={tokenAddr} className="ml-2 text-xs">
                      {info.amount} {token?.symbol || 'Unknown'} ({info.count} tip{info.count !== 1 ? 's' : ''})
                    </div>
                  )
                })}
              </div>
            )
          })}
          <div className="text-xs text-blue-500 mt-1">
            Will be batched and settled automatically when threshold is met
          </div>
        </div>
      )}

      {/* Send Tip Button */}
      <button
        onClick={handleTip}
        disabled={isLoading || !account || (!customAmount && !selectedAmount)}
        className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
          isLoading || !account
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isLoading ? 'Sending Tip...' : `Send ${formatDisplayAmount()} Tip`}
      </button>

      {/* Transaction Status */}
      {txStatus === 'success' && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="text-green-800 text-sm font-medium">
            ✅ Tip sent successfully!
          </div>
          {settlementInfo && (
            <div className="text-green-700 text-xs mt-2">
              🔄 Queued for settlement (ID: {settlementInfo.id.slice(-8)})
              <br />
              ⏰ Estimated ApeChain settlement: {settlementInfo.estimatedTime}
            </div>
          )}
        </div>
      )}

      {txStatus === 'error' && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-800 text-sm font-medium">
            ❌ Tip failed. Please try again.
          </div>
        </div>
      )}

      {!account && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="text-yellow-800 text-sm font-medium">
            👛 Please connect your wallet to send tips
          </div>
        </div>
      )}
    </div>
  )
}