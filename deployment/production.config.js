// Production deployment configuration for StreamTip
const productionConfig = {
  // Network configurations for mainnet deployment
  networks: {
    ethereum: {
      chainId: 1,
      name: 'Ethereum Mainnet',
      rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
      gasPrice: 'auto',
      gasMultiplier: 1.2,
      confirmations: 3,
      timeoutBlocks: 50,
      skipDryRun: false
    },
    polygon: {
      chainId: 137,
      name: 'Polygon Mainnet',
      rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
      gasPrice: 'auto',
      gasMultiplier: 1.1,
      confirmations: 5,
      timeoutBlocks: 100
    },
    base: {
      chainId: 8453,
      name: 'Base Mainnet',
      rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
      gasPrice: 'auto',
      gasMultiplier: 1.1,
      confirmations: 3,
      timeoutBlocks: 50
    },
    apechain: {
      chainId: 33139,
      name: 'ApeChain Mainnet',
      rpcUrl: process.env.APECHAIN_RPC_URL || 'https://apechain.calderachain.xyz/http',
      gasPrice: 'auto',
      gasMultiplier: 1.1,
      confirmations: 5,
      timeoutBlocks: 100
    }
  },

  // Smart contract deployment configuration
  contracts: {
    StreamerRegistry: {
      deploymentOrder: 1,
      constructor: [], // No constructor args
      verify: true,
      upgradeable: false
    },
    TippingContract: {
      deploymentOrder: 2,
      constructor: ['PLATFORM_WALLET', 'STREAMER_REGISTRY_ADDRESS'],
      verify: true,
      upgradeable: false,
      dependencies: ['StreamerRegistry']
    },
    CrossChainTippingBridge: {
      deploymentOrder: 3,
      constructor: ['THIRDWEB_BRIDGE_ADDRESS', 'SWAP_ROUTER_ADDRESS'],
      verify: true,
      upgradeable: false
    }
  },

  // Production environment variables
  environment: {
    required: [
      'NEXT_PUBLIC_THIRDWEB_CLIENT_ID',
      'THIRDWEB_SECRET_KEY',
      'PLATFORM_WALLET_PRIVATE_KEY',
      'PLATFORM_WALLET_ADDRESS',
      'ETHEREUM_RPC_URL',
      'POLYGON_RPC_URL',
      'BASE_RPC_URL',
      'APECHAIN_RPC_URL',
      'ALCHEMY_API_KEY',
      'MONGODB_URI',
      'REDIS_URL',
      'SENTRY_DSN',
      'DATADOG_API_KEY'
    ],
    optional: [
      'CUSTOM_DOMAIN',
      'CDN_URL',
      'BACKUP_RPC_URLS',
      'WEBHOOK_SECRET'
    ]
  },

  // Database configuration
  database: {
    mongodb: {
      uri: process.env.MONGODB_URI,
      options: {
        maxPoolSize: 10,
        minPoolSize: 2,
        maxIdleTimeMS: 30000,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferMaxEntries: 0,
        bufferCommands: false
      },
      collections: {
        tips: 'tips',
        settlements: 'settlements',
        streamers: 'streamers',
        analytics: 'analytics',
        errors: 'errors'
      }
    },
    redis: {
      url: process.env.REDIS_URL,
      options: {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
        lazyConnect: true
      }
    }
  },

  // API configuration
  api: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false
    },
    cors: {
      origin: [
        'https://streamtip.app',
        'https://www.streamtip.app',
        'https://dashboard.streamtip.app',
        /\.streamtip\.app$/,
        // Add partner domains
        /\.twitch\.tv$/,
        /\.youtube\.com$/
      ],
      credentials: true,
      optionsSuccessStatus: 200
    },
    security: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.thirdweb.com"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://*.thirdweb.com", "https://*.alchemy.com"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      }
    }
  },

  // Monitoring and logging
  monitoring: {
    sentry: {
      dsn: process.env.SENTRY_DSN,
      environment: 'production',
      tracesSampleRate: 0.1,
      profilesSampleRate: 0.1,
      integrations: [
        'Http',
        'OnUncaughtException',
        'OnUnhandledRejection',
        'ContextLines'
      ]
    },
    datadog: {
      apiKey: process.env.DATADOG_API_KEY,
      service: 'streamtip',
      version: process.env.VERCEL_GIT_COMMIT_SHA || '1.0.0',
      env: 'production',
      metrics: {
        enabled: true,
        prefix: 'streamtip.'
      },
      logs: {
        enabled: true,
        level: 'info'
      }
    },
    healthCheck: {
      enabled: true,
      path: '/health',
      checks: [
        'database',
        'redis',
        'blockchain-rpc',
        'thirdweb-api',
        'memory-usage',
        'response-time'
      ]
    }
  },

  // Performance optimization
  performance: {
    caching: {
      redis: {
        ttl: {
          default: 300, // 5 minutes
          chainData: 60, // 1 minute
          userProfile: 600, // 10 minutes
          analytics: 1800 // 30 minutes
        }
      },
      cdn: {
        enabled: true,
        provider: 'vercel',
        cacheControl: 'public, max-age=31536000, immutable'
      }
    },
    optimization: {
      bundleAnalyzer: false,
      minimizer: true,
      splitChunks: true,
      compression: 'gzip',
      imageOptimization: true
    }
  },

  // Security configuration
  security: {
    encryption: {
      algorithm: 'aes-256-gcm',
      keyRotation: '90d'
    },
    authentication: {
      sessionTimeout: '24h',
      refreshTokenExpiry: '7d',
      maxLoginAttempts: 5,
      lockoutDuration: '15m'
    },
    rateLimit: {
      tipping: {
        windowMs: 60 * 1000, // 1 minute
        max: 10 // 10 tips per minute per IP
      },
      api: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000 // 1000 requests per 15 minutes
      }
    }
  },

  // Deployment configuration
  deployment: {
    frontend: {
      platform: 'vercel',
      buildCommand: 'npm run build',
      outputDirectory: 'out',
      environmentVariables: [
        'NEXT_PUBLIC_THIRDWEB_CLIENT_ID',
        'NEXT_PUBLIC_PLATFORM_WALLET',
        'NEXT_PUBLIC_TIPPING_CONTRACT',
        'NEXT_PUBLIC_STREAMER_REGISTRY',
        'NEXT_PUBLIC_BRIDGE_CONTRACT',
        'NEXT_PUBLIC_SENTRY_DSN',
        'NEXT_PUBLIC_API_URL'
      ]
    },
    contracts: {
      verificationDelay: 30000, // 30 seconds
      maxGasPrice: '50000000000', // 50 gwei
      deploymentRetries: 3,
      confirmationTimeout: 600000 // 10 minutes
    }
  },

  // Backup and disaster recovery
  backup: {
    database: {
      schedule: '0 2 * * *', // Daily at 2 AM
      retention: '30d',
      encryption: true,
      storage: 's3'
    },
    configurations: {
      schedule: '0 */6 * * *', // Every 6 hours
      retention: '7d',
      includeSecrets: false
    }
  }
};

module.exports = productionConfig;