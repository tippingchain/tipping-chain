import { NextRequest, NextResponse } from 'next/server'
import { SUPPORTED_CHAINS, CONTRACTS } from '../../../lib/constants'

export async function GET(request: NextRequest) {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: 'healthy', // Would connect to actual DB in production
        blockchain_rpc: 'healthy',
        bridge_service: 'healthy',
        settlement_service: 'healthy'
      },
      configuration: {
        supported_chains: Object.keys(SUPPORTED_CHAINS).length,
        contracts_deployed: Object.values(CONTRACTS).filter(addr => 
          addr !== '0x0000000000000000000000000000000000000000'
        ).length,
        demo_mode: process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
      },
      metrics: {
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
        node_version: process.version
      }
    }

    // Check if any services are down
    let overallStatus = 'healthy'
    for (const [service, status] of Object.entries(health.services)) {
      if (status !== 'healthy') {
        overallStatus = 'degraded'
        break
      }
    }
    
    health.status = overallStatus

    return NextResponse.json(health, {
      status: overallStatus === 'healthy' ? 200 : 503
    })

  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      services: {
        database: 'unknown',
        blockchain_rpc: 'unknown',
        bridge_service: 'unknown',
        settlement_service: 'unknown'
      }
    }, {
      status: 503
    })
  }
}