# StreamTip - Cross-Chain Tipping Solution

A comprehensive tipping solution built with thirdweb that enables users to tip streamers with any cryptocurrency, with automatic conversion and settlement in USDC on ApeChain.

## Features

- **Multi-Chain Support**: Tip from Ethereum, Polygon, Base, and other supported networks
- **Any Currency**: Accept tips in ETH, USDC, MATIC, and other ERC-20 tokens
- **Automatic Conversion**: All tips automatically converted to USDC on ApeChain
- **Revenue Sharing**: 5% platform fee, then 70% business / 30% streamer split
- **Real-time Processing**: Instant tip notifications and batch settlement
- **Wallet Integration**: Support for MetaMask, Coinbase Wallet, and in-app wallets

## Architecture

### Smart Contracts

1. **TippingContract**: Core tipping logic with fee distribution
2. **StreamerRegistry**: Manages streamer profiles and business relationships
3. **CrossChainTippingBridge**: Handles cross-chain conversion and ApeChain settlement

### Frontend

- **React/Next.js**: Modern web application
- **thirdweb v5**: Blockchain integration and wallet connection
- **TippingWidget**: Embeddable component for streaming platforms

## Fee Structure

- **Platform Fee**: 5% of all tips
- **Business Share**: 70% of remaining amount after platform fee
- **Streamer Share**: 30% of remaining amount after platform fee

Example: $100 tip
- Platform: $5 (5%)
- Business: $66.50 (70% of $95)
- Streamer: $28.50 (30% of $95)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- thirdweb account and API key

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd thirdweb-tippingchain

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### Environment Setup

Update `.env.local` with your configuration:

```env
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_thirdweb_client_id
NEXT_PUBLIC_PLATFORM_WALLET=your_platform_wallet_address
```

### Development

```bash
# Start development server
npm run dev

# Compile contracts
npm run compile

# Deploy contracts
npm run deploy
```

## Deployment

### Smart Contracts

1. Deploy contracts using thirdweb:
   ```bash
   npx thirdweb deploy contracts/StreamerRegistry.sol
   npx thirdweb deploy contracts/TippingContract.sol
   npx thirdweb deploy contracts/CrossChainTippingBridge.sol
   ```

2. Update `.env.local` with deployed contract addresses

### Frontend

Deploy to Vercel, Netlify, or your preferred hosting platform:

```bash
npm run build
npm run start
```

## Usage

### For Streamers

1. **Register**: Call `registerStreamer` on StreamerRegistry
2. **Set Wallets**: Configure business and ApeChain wallet addresses
3. **Embed Widget**: Add TippingWidget to your streaming platform
4. **Receive Tips**: Tips automatically converted to USDC on ApeChain

### For Viewers

1. **Connect Wallet**: Use any supported wallet
2. **Select Network**: Choose from Ethereum, Polygon, or Base
3. **Choose Token**: Pay with ETH, USDC, MATIC, or other tokens
4. **Send Tip**: Automatic conversion and settlement to ApeChain

### For Businesses

1. **Manage Streamers**: Register and manage multiple streamers
2. **Track Earnings**: Monitor revenue across all streamers
3. **Withdraw Funds**: Access your 70% share of tips

## Integration

### Embedding the Widget

```jsx
import { TippingWidget } from 'streamtip-widget';

function StreamerPage() {
  return (
    <TippingWidget
      streamerAddress="0x..."
      streamerUsername="YourStreamer"
      onTipSent={(tipData) => console.log('Tip sent:', tipData)}
    />
  );
}
```

### API Integration

```javascript
// Register streamer
await streamerRegistry.registerStreamer(
  streamerAddress,
  businessWallet,
  apeChainWallet,
  username,
  profileUrl
);

// Send tip
await tippingContract.tip(
  streamerAddress,
  tokenAddress,
  amount,
  message
);
```

## Cross-Chain Flow

1. **Tip Received**: User tips on any supported chain
2. **Fee Calculation**: Platform fee (5%) deducted immediately
3. **Batch Accumulation**: Tips batched until minimum threshold
4. **Token Swap**: Non-USDC tokens swapped to USDC via DEX
5. **Bridge Transfer**: USDC bridged to ApeChain
6. **Settlement**: Funds distributed to business and streamer wallets

## Security

- **Audited Contracts**: All smart contracts follow OpenZeppelin standards
- **Reentrancy Protection**: ReentrancyGuard on all state-changing functions
- **Access Control**: Proper ownership and permission management
- **Emergency Functions**: Circuit breakers for critical issues

## Support

- Documentation: [Link to docs]
- Discord: [Link to Discord]
- GitHub Issues: [Link to issues]

## License

MIT License - see LICENSE file for details

---

Built with ❤️ using thirdweb