import { NextRequest, NextResponse } from 'next/server'
import { settlementService } from '../../../lib/settlement-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const streamerAddress = searchParams.get('streamerAddress')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    if (!streamerAddress) {
      return NextResponse.json(
        { error: 'streamerAddress is required' },
        { status: 400 }
      )
    }

    // Get settlements based on status filter
    let settlements
    if (status === 'pending') {
      settlements = settlementService.getPendingSettlementsTotal(streamerAddress)
    } else {
      settlements = settlementService.getStreamerSettlements(streamerAddress)
        .slice(0, limit)
    }

    return NextResponse.json({
      success: true,
      data: settlements,
      count: Array.isArray(settlements) ? settlements.length : Object.keys(settlements).length
    })

  } catch (error) {
    console.error('Settlements API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      transactionHash,
      streamerAddress,
      businessAddress,
      tokenAddress,
      amount,
      chainId,
      message
    } = body

    // Validate required fields
    if (!transactionHash || !streamerAddress || !tokenAddress || !amount || !chainId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Process tip for settlement
    const settlementId = await settlementService.processTipForSettlement(
      transactionHash,
      streamerAddress,
      businessAddress,
      tokenAddress,
      amount,
      chainId,
      message
    )

    return NextResponse.json({
      success: true,
      data: {
        settlementId,
        status: 'pending',
        estimatedTime: '15-30 minutes'
      }
    })

  } catch (error) {
    console.error('Settlement creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create settlement' },
      { status: 500 }
    )
  }
}