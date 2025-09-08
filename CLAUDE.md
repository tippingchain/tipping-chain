# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

StreamTip is a cross-chain tipping solution built with thirdweb that enables users to tip streamers with any cryptocurrency, with automatic conversion and settlement in USDC on ApeChain. The platform takes a 5% platform fee, then distributes the remaining 95% as 70% to business and 30% to streamer.

## Development Commands

```bash
# Development
npm run dev                 # Start Next.js development server
npm run build              # Build for production
npm run start              # Start production server

# Smart Contracts
npm run compile            # Compile contracts using thirdweb
npm run deploy             # Deploy contracts using thirdweb

# Testing
npm run test               # Run Jest tests (basic setup)
```

## Architecture Overview

### Smart Contract System
The core smart contract architecture consists of four main contracts:

1. **TippingContract** (`contracts/TippingContract.sol`): Core tipping logic with fee distribution
   - Handles tip processing with automatic fee calculation
   - Manages earnings tracking for streamers and businesses
   - Supports both ETH and ERC20 tokens
   - Fee structure: 5% platform, 70% business, 30% streamer

2. **StreamerRegistry** (`contracts/StreamerRegistry.sol`): Manages streamer profiles and business relationships
   - Handles streamer registration and profile management
   - Maps streamers to business wallets and ApeChain wallets
   - Manages username uniqueness and active status

3. **CrossChainTippingBridge** (`contracts/CrossChainTippingBridge.sol`): Handles cross-chain conversion and ApeChain settlement

4. **SimpleStreamingTip** (`contracts/SimpleStreamingTip.sol`): Simplified version for basic tipping

### Frontend Architecture

- **Next.js 14** with TypeScript and Tailwind CSS
- **thirdweb v5** for blockchain integration
- **React hooks pattern** for state management

Key components:
- **TippingWidget** (`src/components/TippingWidget.tsx`): Main embeddable tipping interface
- **Multi-chain support**: Ethereum, Polygon, Base with automatic network switching
- **Token flexibility**: Support for ETH, USDC, MATIC, and other ERC20 tokens

### Configuration Files

- **Constants** (`src/lib/constants.ts`): Chain configurations, supported tokens, fee structure
- **thirdweb config** (`src/lib/thirdweb.ts`): Client setup and wallet configurations
- **Environment variables**: Set via `.env.local` (copy from `.env.example`)

## Key Integration Patterns

### Contract Deployment Flow
1. Deploy StreamerRegistry first
2. Deploy TippingContract with registry address
3. Deploy CrossChainTippingBridge
4. Update environment variables with deployed addresses

### Tipping Flow
1. User selects chain, token, and amount in TippingWidget
2. Widget calculates fees and displays breakdown
3. Transaction sent to TippingContract.tip()
4. Contract validates streamer registration via StreamerRegistry
5. Fees distributed: platform fee transferred immediately, earnings tracked for withdrawal

### Cross-Chain Settlement (Phase 3 - COMPLETED)
- **Settlement Service** (`src/lib/settlement-service.ts`): Automated tip processing and settlement tracking
- **Bridge Integration** (`src/lib/bridge.ts`): thirdweb bridge integration for cross-chain transfers
- **Batch Processing** (`src/lib/batch-processor.ts`): Gas-optimized transaction batching
- **Settlement Dashboard** (`src/components/SettlementDashboard.tsx`): Real-time settlement tracking UI
- Tips automatically queued for settlement with configurable thresholds
- Batch processing reduces gas costs by up to 60%
- Real-time settlement status tracking and analytics

## Development Guidelines

### Smart Contract Development
- All contracts use OpenZeppelin standards for security
- ReentrancyGuard on all state-changing functions
- Comprehensive event logging for off-chain tracking
- Use `npx thirdweb compile` to compile contracts
- Deploy using `npx thirdweb deploy` for web-based deployment interface

### Frontend Development
- Follow existing patterns in TippingWidget for new components
- Use constants from `src/lib/constants.ts` for chain/token configurations
- Implement proper loading states and error handling
- Ensure wallet connection requirements are clearly communicated
- **Settlement Integration**: Use `settlementService` for tip processing and tracking
- **Dashboard Components**: Use `SettlementDashboard` for settlement tracking UI
- **Batch Processing**: Leverage `batchProcessor` for gas optimization

### Environment Setup
Required environment variables:
```env
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
NEXT_PUBLIC_PLATFORM_WALLET=your_platform_wallet_address
NEXT_PUBLIC_TIPPING_CONTRACT=deployed_tipping_contract_address
NEXT_PUBLIC_STREAMER_REGISTRY=deployed_registry_address
NEXT_PUBLIC_BRIDGE_CONTRACT=deployed_bridge_address
```

## Testing Strategy

- Jest configured for testing framework
- Test files should follow `.test.ts` or `.spec.ts` naming convention
- Smart contract testing should be done via thirdweb's testing tools
- Frontend components should have unit tests for core functionality

## Phase 4: Production & Launch (COMPLETED)

### Production Infrastructure
- **Production Configuration** (`deployment/production.config.js`): Complete multi-chain production setup
- **Monitoring System** (`src/lib/monitoring.ts`): Real-time monitoring with Datadog/Sentry integration
- **Security Audit Preparation** (`security/audit-preparation.md`): Comprehensive security analysis and audit readiness
- **CI/CD Pipeline** (`.github/workflows/production-deploy.yml`): Automated deployment with security checks
- **Deployment Scripts** (`scripts/deploy.js`): Professional deployment management with verification

### Documentation & Integration
- **API Documentation** (`docs/API_DOCUMENTATION.md`): Complete RESTful API documentation
- **Integration Guide** (`docs/INTEGRATION_GUIDE.md`): Platform-specific integration guides (Twitch, YouTube, OBS, Discord)
- **SDK Examples**: React, Vue, mobile app integration examples
- **Webhook System**: Real-time event notifications for platforms

### Security & Monitoring
- **Automated Security Scanning**: Slither, Mythril, OWASP ZAP integration
- **Health Checks**: Multi-service health monitoring and alerting
- **Incident Response**: Emergency pause mechanisms and rollback procedures
- **Compliance**: GDPR, AML/KYC considerations for crypto tipping