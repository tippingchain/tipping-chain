import { NextRequest, NextResponse } from 'next/server'
import { bridgeService } from '../../../lib/bridge'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'queue_settlement':
        const {
          transactionHash,
          sourceChainId,
          tokenAddress,
          amount,
          streamerAddress,
          businessAddress
        } = body

        if (!transactionHash || !sourceChainId || !tokenAddress || !amount) {
          return NextResponse.json(
            { error: 'Missing required fields for queue_settlement' },
            { status: 400 }
          )
        }

        const settlementId = await bridgeService.queueTipForSettlement(
          transactionHash,
          sourceChainId,
          tokenAddress,
          amount,
          streamerAddress,
          businessAddress
        )

        return NextResponse.json({
          success: true,
          data: { settlementId, status: 'queued' }
        })

      case 'process_batch':
        const { batchId } = body

        if (!batchId) {
          return NextResponse.json(
            { error: 'batchId is required for process_batch' },
            { status: 400 }
          )
        }

        const batchResult = await bridgeService.processBatchById(batchId)
        
        return NextResponse.json({
          success: true,
          data: batchResult
        })

      case 'get_status':
        const { settlementIdForStatus } = body

        if (!settlementIdForStatus) {
          return NextResponse.json(
            { error: 'settlementId is required for get_status' },
            { status: 400 }
          )
        }

        const status = await bridgeService.getSettlementStatus(settlementIdForStatus)
        
        return NextResponse.json({
          success: true,
          data: { settlementId: settlementIdForStatus, status }
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: queue_settlement, process_batch, get_status' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Bridge API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    switch (action) {
      case 'pending_batches':
        const pendingBatches = await bridgeService.getPendingBatches()
        return NextResponse.json({
          success: true,
          data: pendingBatches
        })

      case 'bridge_status':
        const bridgeStatus = await bridgeService.getBridgeStatus()
        return NextResponse.json({
          success: true,
          data: bridgeStatus
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: pending_batches, bridge_status' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Bridge API GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}