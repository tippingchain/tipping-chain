# StreamTip API Documentation

## Overview

StreamTip provides a comprehensive RESTful API and SDK for integrating cryptocurrency tipping functionality into streaming platforms. The API handles cross-chain tipping with automatic USDC settlement on ApeChain.

**Base URL**: `https://api.streamtip.app/v1`  
**Authentication**: API Key (Header: `X-API-Key`)  
**Rate Limits**: 1000 requests per 15 minutes per IP

## Table of Contents

1. [Authentication](#authentication)
2. [Error Handling](#error-handling)
3. [Rate Limiting](#rate-limiting)
4. [Streamer Management](#streamer-management)
5. [Tipping Operations](#tipping-operations)
6. [Settlement Tracking](#settlement-tracking)
7. [Analytics](#analytics)
8. [Webhooks](#webhooks)
9. [SDK Integration](#sdk-integration)

---

## Authentication

### API Key Authentication

```http
GET /api/v1/streamers
X-API-Key: your_api_key_here
Content-Type: application/json
```

### Wallet Signature Authentication (for sensitive operations)

```http
POST /api/v1/tips
X-API-Key: your_api_key_here
X-Wallet-Address: 0x742d35Cc6634C0532925a3b8D698b5e7A5c3b5e4
X-Signature: 0x1234567890abcdef...
Content-Type: application/json
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "error": {
    "code": "INVALID_STREAMER",
    "message": "Streamer not found or not registered",
    "details": {
      "streamerAddress": "0x...",
      "timestamp": 1234567890
    },
    "requestId": "req_1234567890abcdef"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_API_KEY` | 401 | API key is missing or invalid |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INVALID_STREAMER` | 404 | Streamer not found |
| `INSUFFICIENT_BALANCE` | 400 | Insufficient token balance |
| `NETWORK_ERROR` | 503 | Blockchain network unavailable |
| `SETTLEMENT_FAILED` | 500 | Settlement processing failed |

---

## Rate Limiting

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1234567890
```

### Rate Limit Tiers

| Tier | Requests per 15min | Upgrade Required |
|------|-------------------|------------------|
| Free | 1,000 | No |
| Pro | 10,000 | Yes |
| Enterprise | 100,000 | Yes |

---

## Streamer Management

### Register Streamer

Register a new streamer for tipping functionality.

**Endpoint**: `POST /streamers`

```http
POST /api/v1/streamers
X-API-Key: your_api_key_here
Content-Type: application/json

{
  "streamerAddress": "0x742d35Cc6634C0532925a3b8D698b5e7A5c3b5e4",
  "businessWallet": "0x1234567890123456789012345678901234567890",
  "apeChainWallet": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
  "username": "awesome_streamer",
  "profileUrl": "https://twitch.tv/awesome_streamer",
  "platform": "twitch"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "streamer": {
    "id": "str_1234567890abcdef",
    "streamerAddress": "0x742d35Cc6634C0532925a3b8D698b5e7A5c3b5e4",
    "businessWallet": "0x1234567890123456789012345678901234567890",
    "apeChainWallet": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
    "username": "awesome_streamer",
    "profileUrl": "https://twitch.tv/awesome_streamer",
    "platform": "twitch",
    "isActive": true,
    "registrationTimestamp": 1234567890,
    "totalEarnings": "0",
    "tipCount": 0
  }
}
```

### Get Streamer Details

**Endpoint**: `GET /streamers/{streamerAddress}`

```http
GET /api/v1/streamers/0x742d35Cc6634C0532925a3b8D698b5e7A5c3b5e4
X-API-Key: your_api_key_here
```

**Response** (200 OK):
```json
{
  "success": true,
  "streamer": {
    "id": "str_1234567890abcdef",
    "streamerAddress": "0x742d35Cc6634C0532925a3b8D698b5e7A5c3b5e4",
    "username": "awesome_streamer",
    "isActive": true,
    "totalEarnings": "1250.50",
    "tipCount": 85,
    "settlementInfo": {
      "pendingSettlements": "45.20",
      "lastSettlement": 1234567890,
      "totalSettled": "1205.30"
    }
  }
}
```

### Update Streamer

**Endpoint**: `PATCH /streamers/{streamerAddress}`

```http
PATCH /api/v1/streamers/0x742d35Cc6634C0532925a3b8D698b5e7A5c3b5e4
X-API-Key: your_api_key_here
X-Wallet-Address: 0x742d35Cc6634C0532925a3b8D698b5e7A5c3b5e4
X-Signature: 0x1234567890abcdef...
Content-Type: application/json

{
  "businessWallet": "0xnewbusinesswallet123456789012345678901234",
  "apeChainWallet": "0xnewapechainwallet123456789012345678901234",
  "profileUrl": "https://twitch.tv/new_awesome_streamer"
}
```

---

## Tipping Operations

### Send Tip

Process a cryptocurrency tip for a streamer.

**Endpoint**: `POST /tips`

```http
POST /api/v1/tips
X-API-Key: your_api_key_here
Content-Type: application/json

{
  "streamerAddress": "0x742d35Cc6634C0532925a3b8D698b5e7A5c3b5e4",
  "tipperAddress": "0x9876543210987654321098765432109876543210",
  "tokenAddress": "0xA0b86991c431C7d4E5C1b6e9b10A3A4C7FE6eD8A9",
  "amount": "10000000",
  "chainId": 1,
  "message": "Great stream! Keep it up!",
  "transactionHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "tip": {
    "id": "tip_1234567890abcdef",
    "streamerAddress": "0x742d35Cc6634C0532925a3b8D698b5e7A5c3b5e4",
    "tipperAddress": "0x9876543210987654321098765432109876543210",
    "amount": "10000000",
    "token": {
      "address": "0xA0b86991c431C7d4E5C1b6e9b10A3A4C7FE6eD8A9",
      "symbol": "USDC",
      "decimals": 6
    },
    "chainId": 1,
    "usdValue": "10.00",
    "message": "Great stream! Keep it up!",
    "transactionHash": "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "timestamp": 1234567890,
    "feeBreakdown": {
      "platformFee": "0.50",
      "businessAmount": "6.65",
      "streamerAmount": "2.85"
    },
    "settlementInfo": {
      "settlementId": "settlement_1234567890abcdef",
      "status": "pending",
      "estimatedSettlementTime": 1234569690
    }
  }
}
```

### Get Tip Details

**Endpoint**: `GET /tips/{tipId}`

```http
GET /api/v1/tips/tip_1234567890abcdef
X-API-Key: your_api_key_here
```

### List Tips

**Endpoint**: `GET /tips`

```http
GET /api/v1/tips?streamerAddress=0x742d35Cc&limit=50&offset=0&status=completed
X-API-Key: your_api_key_here
```

**Query Parameters**:
- `streamerAddress` (optional): Filter by streamer
- `tipperAddress` (optional): Filter by tipper  
- `chainId` (optional): Filter by blockchain
- `status` (optional): Filter by status (pending, processing, completed, failed)
- `limit` (optional): Number of results (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `fromDate` (optional): Filter from date (ISO 8601)
- `toDate` (optional): Filter to date (ISO 8601)

---

## Settlement Tracking

### Get Settlement Status

**Endpoint**: `GET /settlements/{settlementId}`

```http
GET /api/v1/settlements/settlement_1234567890abcdef
X-API-Key: your_api_key_here
```

**Response** (200 OK):
```json
{
  "success": true,
  "settlement": {
    "id": "settlement_1234567890abcdef",
    "streamerAddress": "0x742d35Cc6634C0532925a3b8D698b5e7A5c3b5e4",
    "status": "completed",
    "tipIds": ["tip_1", "tip_2", "tip_3"],
    "originalToken": "0xA0b86991c431C7d4E5C1b6e9b10A3A4C7FE6eD8A9",
    "originalAmount": "50000000",
    "usdcAmount": "50000000",
    "chainId": 1,
    "apeChainTxHash": "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
    "processingTime": 1456789,
    "gasUsed": "150000",
    "bridgeFee": "0.25",
    "timestamp": 1234567890,
    "completedAt": 1234569346
  }
}
```

### List Settlements

**Endpoint**: `GET /settlements`

```http
GET /api/v1/settlements?streamerAddress=0x742d35Cc&status=pending
X-API-Key: your_api_key_here
```

### Trigger Manual Settlement

**Endpoint**: `POST /settlements/manual`

```http
POST /api/v1/settlements/manual
X-API-Key: your_api_key_here
X-Wallet-Address: 0x742d35Cc6634C0532925a3b8D698b5e7A5c3b5e4
X-Signature: 0x1234567890abcdef...
Content-Type: application/json

{
  "streamerAddress": "0x742d35Cc6634C0532925a3b8D698b5e7A5c3b5e4",
  "chainId": 1,
  "tokenAddress": "0xA0b86991c431C7d4E5C1b6e9b10A3A4C7FE6eD8A9"
}
```

---

## Analytics

### Get Streamer Analytics

**Endpoint**: `GET /analytics/streamers/{streamerAddress}`

```http
GET /api/v1/analytics/streamers/0x742d35Cc6634C0532925a3b8D698b5e7A5c3b5e4?period=30d
X-API-Key: your_api_key_here
```

**Response** (200 OK):
```json
{
  "success": true,
  "analytics": {
    "period": "30d",
    "summary": {
      "totalTips": 156,
      "totalVolume": "2850.75",
      "totalSettled": "2805.50",
      "pendingSettlement": "45.25",
      "averageTipSize": "18.28",
      "uniqueTippers": 89
    },
    "breakdown": {
      "byChain": {
        "1": { "tips": 89, "volume": "1650.25" },
        "137": { "tips": 45, "volume": "820.50" },
        "8453": { "tips": 22, "volume": "380.00" }
      },
      "byToken": {
        "ETH": { "tips": 67, "volume": "1250.75" },
        "USDC": { "tips": 78, "volume": "1450.00" },
        "MATIC": { "tips": 11, "volume": "150.00" }
      }
    },
    "timeline": [
      {
        "date": "2024-01-01",
        "tips": 12,
        "volume": "245.50"
      }
    ]
  }
}
```

### Get Platform Analytics

**Endpoint**: `GET /analytics/platform`

```http
GET /api/v1/analytics/platform?period=7d
X-API-Key: your_api_key_here
```

---

## Webhooks

### Configure Webhook Endpoints

**Endpoint**: `POST /webhooks`

```http
POST /api/v1/webhooks
X-API-Key: your_api_key_here
Content-Type: application/json

{
  "url": "https://yourapp.com/webhooks/streamtip",
  "events": ["tip.created", "settlement.completed", "settlement.failed"],
  "secret": "your_webhook_secret_key"
}
```

### Webhook Events

#### Tip Created
```json
{
  "event": "tip.created",
  "timestamp": 1234567890,
  "data": {
    "tip": {
      "id": "tip_1234567890abcdef",
      "streamerAddress": "0x742d35Cc6634C0532925a3b8D698b5e7A5c3b5e4",
      "amount": "10000000",
      "usdValue": "10.00",
      "message": "Great stream!",
      "transactionHash": "0xabc..."
    }
  }
}
```

#### Settlement Completed
```json
{
  "event": "settlement.completed",
  "timestamp": 1234567890,
  "data": {
    "settlement": {
      "id": "settlement_1234567890abcdef",
      "streamerAddress": "0x742d35Cc6634C0532925a3b8D698b5e7A5c3b5e4",
      "usdcAmount": "50000000",
      "apeChainTxHash": "0xdef...",
      "tipCount": 5
    }
  }
}
```

---

## SDK Integration

### JavaScript/TypeScript SDK

#### Installation

```bash
npm install @streamtip/sdk
```

#### Basic Usage

```typescript
import { StreamTipSDK } from '@streamtip/sdk';

const streamTip = new StreamTipSDK({
  apiKey: 'your_api_key_here',
  environment: 'production' // or 'sandbox'
});

// Register a streamer
const streamer = await streamTip.streamers.register({
  streamerAddress: '0x742d35Cc6634C0532925a3b8D698b5e7A5c3b5e4',
  businessWallet: '0x1234567890123456789012345678901234567890',
  apeChainWallet: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
  username: 'awesome_streamer',
  profileUrl: 'https://twitch.tv/awesome_streamer'
});

// Process a tip
const tip = await streamTip.tips.create({
  streamerAddress: '0x742d35Cc6634C0532925a3b8D698b5e7A5c3b5e4',
  tipperAddress: '0x9876543210987654321098765432109876543210',
  tokenAddress: '0xA0b86991c431C7d4E5C1b6e9b10A3A4C7FE6eD8A9',
  amount: '10000000',
  chainId: 1,
  message: 'Great stream!',
  transactionHash: '0xabc...'
});

// Track settlement
const settlement = await streamTip.settlements.get(tip.settlementInfo.settlementId);
console.log('Settlement status:', settlement.status);
```

#### React Integration

```tsx
import React from 'react';
import { TippingWidget } from '@streamtip/react';

function StreamPage() {
  return (
    <div>
      <h1>My Stream</h1>
      <TippingWidget
        streamerAddress="0x742d35Cc6634C0532925a3b8D698b5e7A5c3b5e4"
        streamerUsername="awesome_streamer"
        apiKey="your_api_key_here"
        onTipSent={(tip) => {
          console.log('Tip sent:', tip);
        }}
        theme="dark"
      />
    </div>
  );
}
```

### Python SDK

#### Installation

```bash
pip install streamtip-sdk
```

#### Basic Usage

```python
from streamtip import StreamTipSDK

# Initialize SDK
sdk = StreamTipSDK(
    api_key='your_api_key_here',
    environment='production'
)

# Register streamer
streamer = sdk.streamers.register(
    streamer_address='0x742d35Cc6634C0532925a3b8D698b5e7A5c3b5e4',
    business_wallet='0x1234567890123456789012345678901234567890',
    apechain_wallet='0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
    username='awesome_streamer',
    profile_url='https://twitch.tv/awesome_streamer'
)

# Get analytics
analytics = sdk.analytics.get_streamer_analytics(
    streamer_address='0x742d35Cc6634C0532925a3b8D698b5e7A5c3b5e4',
    period='30d'
)

print(f"Total volume: ${analytics['summary']['total_volume']}")
```

---

## Sandbox Environment

**Base URL**: `https://api-sandbox.streamtip.app/v1`

- Test with fake transactions
- No real cryptocurrency involved
- Same API structure as production
- Rate limits: 10,000 requests per hour

### Test Accounts

```json
{
  "testStreamer": "0x0000000000000000000000000000000000000001",
  "testTipper": "0x0000000000000000000000000000000000000002",
  "testTokens": {
    "USDC": "0x0000000000000000000000000000000000000010",
    "ETH": "0x0000000000000000000000000000000000000000"
  }
}
```

---

## Support and Resources

- **Documentation**: https://docs.streamtip.app
- **Discord**: https://discord.gg/streamtip
- **GitHub**: https://github.com/streamtip/api
- **Status Page**: https://status.streamtip.app
- **Support Email**: support@streamtip.app

---

*Last updated: January 2025*