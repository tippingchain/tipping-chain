# StreamTip Integration Guide

## Table of Contents

1. [Quick Start](#quick-start)
2. [Twitch Integration](#twitch-integration)
3. [YouTube Integration](#youtube-integration)
4. [OBS Studio Integration](#obs-studio-integration)
5. [Discord Bot Integration](#discord-bot-integration)
6. [Custom Website Integration](#custom-website-integration)
7. [Mobile App Integration](#mobile-app-integration)
8. [Advanced Customization](#advanced-customization)

---

## Quick Start

### 1. Get API Credentials

1. Visit [StreamTip Dashboard](https://dashboard.streamtip.app)
2. Create an account or sign in
3. Generate your API key
4. Note your client ID for frontend integration

### 2. Register Your Streamer Profile

```bash
curl -X POST https://api.streamtip.app/v1/streamers \
  -H "X-API-Key: your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "streamerAddress": "0x742d35Cc6634C0532925a3b8D698b5e7A5c3b5e4",
    "businessWallet": "0x1234567890123456789012345678901234567890",
    "apeChainWallet": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef",
    "username": "your_username",
    "profileUrl": "https://twitch.tv/your_username",
    "platform": "twitch"
  }'
```

### 3. Add Widget to Your Stream

```html
<iframe 
  src="https://widget.streamtip.app/v1/tip?streamer=your_username&theme=dark"
  width="320"
  height="480"
  frameborder="0">
</iframe>
```

---

## Twitch Integration

### Browser Source Setup

1. **Open OBS Studio**
2. **Add Browser Source**:
   - URL: `https://widget.streamtip.app/v1/tip?streamer=YOUR_USERNAME&theme=dark`
   - Width: `320`
   - Height: `480`
   - Custom CSS (optional): See [Customization](#advanced-customization)

3. **Position the Widget**:
   - Drag to desired location on your stream
   - Resize as needed
   - Set opacity if needed

### Twitch Extension (Coming Soon)

```json
{
  "extension_id": "streamtip_tipping",
  "version": "1.0.0",
  "panel_height": 300,
  "configuration": {
    "streamerAddress": "0x742d35Cc6634C0532925a3b8D698b5e7A5c3b5e4",
    "theme": "purple",
    "showGoal": true,
    "goalAmount": "100"
  }
}
```

### Twitch Chat Bot Integration

```javascript
// Node.js Twitch Bot Example
const tmi = require('tmi.js');
const StreamTip = require('@streamtip/sdk');

const streamTip = new StreamTip({ apiKey: 'your_api_key' });

const client = new tmi.Client({
  connection: { reconnect: true },
  identity: {
    username: 'your_bot_username',
    password: 'oauth:your_oauth_token'
  },
  channels: ['your_channel']
});

client.connect();

// Listen for tip events via webhook
streamTip.webhooks.on('tip.created', (tip) => {
  const message = `💰 ${tip.tipperUsername} just tipped $${tip.usdValue}! "${tip.message}"`;
  client.say('your_channel', message);
});

// Chat commands
client.on('message', (channel, tags, message, self) => {
  if (self) return;

  if (message.toLowerCase() === '!tip') {
    client.say(channel, `Send crypto tips at: https://streamtip.app/${tags.username}`);
  }
});
```

---

## YouTube Integration

### Stream Overlay Setup

1. **Using Streamlabs**:
   ```html
   <!-- Add as Custom Widget -->
   <div class="streamtip-widget">
     <iframe 
       src="https://widget.streamtip.app/v1/tip?streamer=YOUR_YOUTUBE_CHANNEL_ID&platform=youtube"
       width="300" 
       height="400">
     </iframe>
   </div>
   ```

2. **Using OBS Studio**: Same as Twitch setup above

### YouTube Chat Integration

```python
# Python YouTube Chat Bot
import asyncio
from streamtip import StreamTipSDK
from pytchat import LiveChatAsync

sdk = StreamTipSDK(api_key='your_api_key')

async def main():
    livechat = LiveChatAsync("YOUR_VIDEO_ID")
    
    # Listen for StreamTip webhooks
    @sdk.webhooks.on('tip.created')
    def on_tip_received(tip):
        print(f"💰 New tip: ${tip['usdValue']} from {tip['tipperAddress']}")
        # Could integrate with YouTube API to post message
    
    # Monitor chat for tip commands
    async for chatdata in livechat.async_items():
        for c in chatdata.items:
            if c.message.lower().startswith('!tip'):
                print(f"Tip command from {c.author.name}: {c.message}")

if __name__ == '__main__':
    asyncio.run(main())
```

### YouTube Description Template

```markdown
💰 **Support the Stream with Crypto Tips!**
Send tips in ETH, USDC, or any crypto - automatically converted to USDC!

🎯 **How to Tip:**
1. Visit: https://streamtip.app/YOUR_USERNAME
2. Connect your crypto wallet
3. Choose amount and token
4. Send tip with optional message

✨ **Features:**
- Multi-chain support (Ethereum, Polygon, Base)
- Instant notifications on stream
- Automatic settlement to USDC on ApeChain
- No minimum amount required

#CryptoTips #Web3Streaming #StreamTip
```

---

## OBS Studio Integration

### Widget Browser Source

```json
{
  "source_name": "StreamTip Widget",
  "source_type": "browser_source",
  "settings": {
    "url": "https://widget.streamtip.app/v1/tip?streamer=YOUR_USERNAME",
    "width": 320,
    "height": 480,
    "custom_css": "body { background: transparent; }",
    "shutdown": false,
    "restart_when_active": false
  }
}
```

### Alert Overlay

```html
<!-- StreamTip Alert Overlay -->
<!DOCTYPE html>
<html>
<head>
  <style>
    .tip-alert {
      position: fixed;
      top: 50px;
      right: 50px;
      padding: 20px;
      background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
      border-radius: 10px;
      color: white;
      font-family: 'Arial', sans-serif;
      transform: translateX(500px);
      transition: transform 0.5s ease;
    }
    
    .tip-alert.show {
      transform: translateX(0);
    }
    
    .tip-amount {
      font-size: 24px;
      font-weight: bold;
    }
    
    .tip-message {
      margin-top: 10px;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div id="tipAlert" class="tip-alert">
    <div class="tip-amount">$<span id="amount">0</span></div>
    <div>from <span id="tipper">Anonymous</span></div>
    <div class="tip-message" id="message"></div>
  </div>

  <script>
    // Connect to StreamTip WebSocket
    const ws = new WebSocket('wss://alerts.streamtip.app/v1/alerts?streamer=YOUR_USERNAME');
    
    ws.onmessage = function(event) {
      const tip = JSON.parse(event.data);
      showTipAlert(tip);
    };

    function showTipAlert(tip) {
      document.getElementById('amount').textContent = tip.usdValue;
      document.getElementById('tipper').textContent = tip.tipperUsername || 'Anonymous';
      document.getElementById('message').textContent = tip.message;
      
      const alert = document.getElementById('tipAlert');
      alert.classList.add('show');
      
      setTimeout(() => {
        alert.classList.remove('show');
      }, 5000);
    }
  </script>
</body>
</html>
```

---

## Discord Bot Integration

### Setup Discord Bot

```javascript
// Discord Bot with StreamTip Integration
const Discord = require('discord.js');
const StreamTip = require('@streamtip/sdk');

const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.MessageContent
  ]
});

const streamTip = new StreamTip({ apiKey: 'your_api_key' });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Slash Commands
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'tip') {
    const streamerName = interaction.options.getString('streamer');
    
    const embed = new Discord.EmbedBuilder()
      .setColor(0x667eea)
      .setTitle('💰 Send a Crypto Tip!')
      .setDescription(`Support ${streamerName} with cryptocurrency`)
      .addFields(
        { name: '🔗 Tip Link', value: `https://streamtip.app/${streamerName}` },
        { name: '💎 Supported Tokens', value: 'ETH, USDC, MATIC, and more!' },
        { name: '⚡ Networks', value: 'Ethereum, Polygon, Base' }
      )
      .setFooter({ text: 'Powered by StreamTip' });

    await interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === 'earnings') {
    // Fetch streamer earnings
    const analytics = await streamTip.analytics.getStreamerAnalytics(
      interaction.user.id, // Assuming Discord ID maps to streamer
      { period: '7d' }
    );

    const embed = new Discord.EmbedBuilder()
      .setColor(0x4CAF50)
      .setTitle('📊 Your Earnings (Last 7 Days)')
      .addFields(
        { name: '💰 Total Volume', value: `$${analytics.summary.totalVolume}`, inline: true },
        { name: '💸 Tips Received', value: analytics.summary.totalTips.toString(), inline: true },
        { name: '👥 Unique Tippers', value: analytics.summary.uniqueTippers.toString(), inline: true }
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
});

// Listen for tip events
streamTip.webhooks.on('tip.created', (tip) => {
  const channel = client.channels.cache.get('YOUR_ANNOUNCEMENTS_CHANNEL_ID');
  
  const embed = new Discord.EmbedBuilder()
    .setColor(0xFFD700)
    .setTitle('💰 New Tip Received!')
    .addFields(
      { name: 'Amount', value: `$${tip.usdValue}`, inline: true },
      { name: 'Token', value: tip.token.symbol, inline: true },
      { name: 'Network', value: getChainName(tip.chainId), inline: true }
    );

  if (tip.message) {
    embed.addFields({ name: 'Message', value: `"${tip.message}"` });
  }

  channel.send({ embeds: [embed] });
});

client.login('your_discord_bot_token');
```

### Register Slash Commands

```javascript
// deploy-commands.js
const { REST, Routes } = require('discord.js');

const commands = [
  {
    name: 'tip',
    description: 'Get tip link for a streamer',
    options: [{
      name: 'streamer',
      type: 3, // STRING
      description: 'Streamer username',
      required: true
    }]
  },
  {
    name: 'earnings',
    description: 'View your streaming earnings',
  }
];

const rest = new REST({ version: '10' }).setToken('your_discord_bot_token');

(async () => {
  await rest.put(
    Routes.applicationGuildCommands('your_bot_id', 'your_guild_id'),
    { body: commands }
  );
})();
```

---

## Custom Website Integration

### React Integration

```tsx
// React Component
import React, { useState, useEffect } from 'react';
import { StreamTipProvider, TippingWidget, useStreamTipAnalytics } from '@streamtip/react';

function StreamerPage({ streamerAddress }: { streamerAddress: string }) {
  const { analytics, loading } = useStreamTipAnalytics(streamerAddress);
  const [recentTips, setRecentTips] = useState([]);

  return (
    <StreamTipProvider apiKey="your_api_key">
      <div className="streamer-page">
        <h1>My Stream</h1>
        
        {/* Embedded Tipping Widget */}
        <div className="tipping-section">
          <TippingWidget
            streamerAddress={streamerAddress}
            theme="custom"
            customColors={{
              primary: '#667eea',
              background: '#1a1a1a',
              text: '#ffffff'
            }}
            onTipSent={(tip) => {
              console.log('Tip received:', tip);
              setRecentTips(prev => [tip, ...prev.slice(0, 4)]);
            }}
          />
        </div>

        {/* Recent Tips Display */}
        <div className="recent-tips">
          <h3>Recent Tips 💰</h3>
          {recentTips.map((tip, index) => (
            <div key={index} className="tip-item">
              <span>${tip.usdValue}</span>
              <span>{tip.token.symbol}</span>
              {tip.message && <span>"{tip.message}"</span>}
            </div>
          ))}
        </div>

        {/* Analytics Dashboard */}
        {!loading && analytics && (
          <div className="analytics-section">
            <h3>Earnings Overview</h3>
            <div className="stats-grid">
              <div className="stat">
                <h4>${analytics.summary.totalVolume}</h4>
                <p>Total Earned</p>
              </div>
              <div className="stat">
                <h4>{analytics.summary.totalTips}</h4>
                <p>Tips Received</p>
              </div>
              <div className="stat">
                <h4>{analytics.summary.uniqueTippers}</h4>
                <p>Unique Supporters</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </StreamTipProvider>
  );
}

export default StreamerPage;
```

### Vanilla JavaScript Integration

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Stream</title>
  <script src="https://cdn.streamtip.app/v1/streamtip.min.js"></script>
</head>
<body>
  <div id="streamtip-widget"></div>
  
  <script>
    const streamTip = new StreamTip({
      apiKey: 'your_api_key',
      containerId: 'streamtip-widget',
      streamerAddress: '0x742d35Cc6634C0532925a3b8D698b5e7A5c3b5e4',
      theme: 'dark',
      onTipSent: function(tip) {
        // Show custom notification
        showTipNotification(tip);
      }
    });

    function showTipNotification(tip) {
      const notification = document.createElement('div');
      notification.className = 'tip-notification';
      notification.innerHTML = `
        <h4>New Tip! 💰</h4>
        <p>$${tip.usdValue} in ${tip.token.symbol}</p>
        ${tip.message ? `<p>"${tip.message}"</p>` : ''}
      `;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 5000);
    }
  </script>

  <style>
    .tip-notification {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #667eea;
      color: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
    }
  </style>
</body>
</html>
```

---

## Mobile App Integration

### React Native

```tsx
// React Native Component
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

interface StreamTipWidgetProps {
  streamerAddress: string;
  theme?: 'light' | 'dark';
}

export const StreamTipWidget: React.FC<StreamTipWidgetProps> = ({
  streamerAddress,
  theme = 'light'
}) => {
  const widgetUrl = `https://widget.streamtip.app/v1/mobile?streamer=${streamerAddress}&theme=${theme}`;

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: widgetUrl }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        onMessage={(event) => {
          // Handle messages from widget
          const data = JSON.parse(event.nativeEvent.data);
          if (data.type === 'tip_sent') {
            // Handle tip success
            console.log('Tip sent:', data.tip);
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
});
```

### Flutter Integration

```dart
// Flutter Widget
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class StreamTipWidget extends StatefulWidget {
  final String streamerAddress;
  final String theme;

  const StreamTipWidget({
    Key? key,
    required this.streamerAddress,
    this.theme = 'light',
  }) : super(key: key);

  @override
  _StreamTipWidgetState createState() => _StreamTipWidgetState();
}

class _StreamTipWidgetState extends State<StreamTipWidget> {
  late final WebViewController controller;

  @override
  void initState() {
    super.initState();
    
    final String widgetUrl = 'https://widget.streamtip.app/v1/mobile'
        '?streamer=${widget.streamerAddress}&theme=${widget.theme}';
    
    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onWebResourceError: (error) {
          debugPrint('WebView error: ${error.description}');
        },
      ))
      ..loadRequest(Uri.parse(widgetUrl));
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 400,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: WebViewWidget(controller: controller),
      ),
    );
  }
}
```

---

## Advanced Customization

### Custom CSS for Widget

```css
/* Custom StreamTip Widget Styling */
.streamtip-widget {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --background-color: rgba(0, 0, 0, 0.9);
  --text-color: #ffffff;
  --border-radius: 12px;
  --shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.streamtip-widget .tip-button {
  background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
  border: none;
  border-radius: var(--border-radius);
  color: var(--text-color);
  font-weight: 600;
  transition: all 0.3s ease;
}

.streamtip-widget .tip-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}

.streamtip-widget .amount-selector {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 16px 0;
}

.streamtip-widget .amount-option {
  padding: 12px;
  border: 2px solid transparent;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
}

.streamtip-widget .amount-option:hover,
.streamtip-widget .amount-option.selected {
  border-color: var(--primary-color);
  background: rgba(102, 126, 234, 0.1);
}
```

### Custom JavaScript Events

```javascript
// Listen for custom StreamTip events
window.addEventListener('streamtip:ready', function(event) {
  console.log('StreamTip widget loaded');
});

window.addEventListener('streamtip:tip_started', function(event) {
  console.log('User started tip process', event.detail);
  // Show loading indicator
});

window.addEventListener('streamtip:tip_completed', function(event) {
  console.log('Tip completed successfully', event.detail);
  // Trigger celebration animation
  triggerCelebration();
});

window.addEventListener('streamtip:tip_failed', function(event) {
  console.error('Tip failed', event.detail);
  // Show error message
});

function triggerCelebration() {
  // Custom confetti or animation
  const canvas = document.getElementById('celebration-canvas');
  // Implement celebration animation
}
```

### Webhook Handler Example

```javascript
// Express.js Webhook Handler
const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.json());

// Webhook endpoint
app.post('/webhooks/streamtip', (req, res) => {
  const signature = req.headers['x-streamtip-signature'];
  const payload = JSON.stringify(req.body);
  const secret = process.env.STREAMTIP_WEBHOOK_SECRET;

  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  if (signature !== `sha256=${expectedSignature}`) {
    return res.status(401).send('Unauthorized');
  }

  // Handle different event types
  const { event, data } = req.body;

  switch (event) {
    case 'tip.created':
      handleNewTip(data.tip);
      break;
    case 'settlement.completed':
      handleSettlementCompleted(data.settlement);
      break;
    case 'settlement.failed':
      handleSettlementFailed(data.settlement);
      break;
  }

  res.status(200).send('OK');
});

function handleNewTip(tip) {
  // Send notification to streamer
  // Update database
  // Trigger alerts
}

function handleSettlementCompleted(settlement) {
  // Notify streamer of successful settlement
  // Update earnings dashboard
}

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});
```

---

## Testing Your Integration

### Sandbox Environment

Use the sandbox environment for testing:

```javascript
const streamTip = new StreamTip({
  apiKey: 'sandbox_api_key',
  environment: 'sandbox'
});

// Test tip
const testTip = await streamTip.tips.create({
  streamerAddress: '0x0000000000000000000000000000000000000001',
  tipperAddress: '0x0000000000000000000000000000000000000002',
  tokenAddress: '0x0000000000000000000000000000000000000010', // Test USDC
  amount: '1000000', // $1 USDC
  chainId: 1,
  message: 'Test tip!',
  transactionHash: '0xtest123...'
});
```

### Integration Checklist

- [ ] API credentials configured
- [ ] Streamer registered successfully
- [ ] Widget displays correctly
- [ ] Tip flow works end-to-end
- [ ] Webhooks receiving events
- [ ] Analytics tracking properly
- [ ] Error handling implemented
- [ ] Mobile responsiveness tested
- [ ] Accessibility compliance verified

---

*For additional support, visit our [Discord](https://discord.gg/streamtip) or contact support@streamtip.app*