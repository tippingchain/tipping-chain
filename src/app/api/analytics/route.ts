import { NextRequest, NextResponse } from 'next/server'
import { settlementService } from '../../../lib/settlement-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const streamerAddress = searchParams.get('streamerAddress')
    const timeframe = searchParams.get('timeframe') || '7d' // 24h, 7d, 30d, all
    
    if (!streamerAddress) {
      return NextResponse.json(
        { error: 'streamerAddress is required' },
        { status: 400 }
      )
    }

    // Get analytics data
    const analytics = settlementService.getSettlementAnalytics(streamerAddress)
    
    // Filter by timeframe
    const now = Date.now()
    const timeframes = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      'all': Infinity
    }
    
    const timeLimit = now - (timeframes[timeframe as keyof typeof timeframes] || timeframes['7d'])
    
    // Calculate filtered metrics
    const settlements = settlementService.getStreamerSettlements(streamerAddress)
    const filteredSettlements = settlements.filter(s => s.timestamp > timeLimit)
    
    const metrics = {
      totalTips: filteredSettlements.length,
      totalVolume: filteredSettlements.reduce((sum, s) => sum + parseFloat(s.totalAmount), 0),
      averageTip: filteredSettlements.length > 0 
        ? filteredSettlements.reduce((sum, s) => sum + parseFloat(s.totalAmount), 0) / filteredSettlements.length 
        : 0,
      uniqueTippers: filteredSettlements.reduce((sum, s) => sum + s.tipIds.length, 0), // Count unique tip transactions
      chainDistribution: filteredSettlements.reduce((acc, s) => {
        acc[s.chain] = (acc[s.chain] || 0) + 1
        return acc
      }, {} as Record<number, number>),
      tokenDistribution: filteredSettlements.reduce((acc, s) => {
        acc[s.token] = (acc[s.token] || 0) + parseFloat(s.totalAmount)
        return acc
      }, {} as Record<string, number>),
      dailyVolume: filteredSettlements.reduce((acc, s) => {
        const date = new Date(s.timestamp).toISOString().split('T')[0]
        acc[date] = (acc[date] || 0) + parseFloat(s.totalAmount)
        return acc
      }, {} as Record<string, number>)
    }

    return NextResponse.json({
      success: true,
      data: {
        timeframe,
        streamerAddress,
        metrics,
        settlements: filteredSettlements.slice(0, 10) // Latest 10 settlements
      }
    })

  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}