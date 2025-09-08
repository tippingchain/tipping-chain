#!/usr/bin/env node

/**
 * StreamTip Deployment Script
 * Handles complete deployment of smart contracts and infrastructure
 */

const { ethers } = require('hardhat');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');

// Configuration
const NETWORKS = {
  mainnet: {
    name: 'Ethereum Mainnet',
    chainId: 1,
    gasPrice: '30000000000', // 30 gwei
    confirmations: 3
  },
  polygon: {
    name: 'Polygon Mainnet', 
    chainId: 137,
    gasPrice: '30000000000', // 30 gwei
    confirmations: 5
  },
  base: {
    name: 'Base Mainnet',
    chainId: 8453,
    gasPrice: '1000000000', // 1 gwei
    confirmations: 3
  },
  apechain: {
    name: 'ApeChain Mainnet',
    chainId: 33139,
    gasPrice: '1000000000', // 1 gwei
    confirmations: 5
  }
};

const DEPLOYMENT_CONFIG = {
  contracts: {
    StreamerRegistry: {
      order: 1,
      constructor: []
    },
    TippingContract: {
      order: 2,
      constructor: ['PLATFORM_WALLET', 'STREAMER_REGISTRY']
    },
    CrossChainTippingBridge: {
      order: 3,
      constructor: ['THIRDWEB_BRIDGE', 'SWAP_ROUTER']
    }
  }
};

class DeploymentManager {
  constructor() {
    this.deployedContracts = {};
    this.deploymentLog = [];
    this.network = null;
    this.signer = null;
  }

  async init() {
    console.log(chalk.blue('🚀 StreamTip Deployment Manager\n'));

    // Network selection
    const { network } = await inquirer.prompt([{
      type: 'list',
      name: 'network',
      message: 'Select deployment network:',
      choices: Object.keys(NETWORKS).map(key => ({
        name: `${NETWORKS[key].name} (${key})`,
        value: key
      }))
    }]);

    this.network = network;
    console.log(chalk.green(`Selected network: ${NETWORKS[network].name}\n`));

    // Initialize signer
    const [deployer] = await ethers.getSigners();
    this.signer = deployer;
    
    const balance = await deployer.getBalance();
    console.log(chalk.yellow(`Deployer address: ${deployer.address}`));
    console.log(chalk.yellow(`Deployer balance: ${ethers.utils.formatEther(balance)} ETH\n`));

    // Pre-deployment checks
    await this.preDeploymentChecks();
  }

  async preDeploymentChecks() {
    console.log(chalk.blue('🔍 Pre-deployment checks...\n'));

    // Check environment variables
    const requiredEnvVars = [
      'PLATFORM_WALLET_ADDRESS',
      'THIRDWEB_BRIDGE_ADDRESS',
      'UNISWAP_ROUTER_ADDRESS'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        console.log(chalk.red(`❌ Missing environment variable: ${envVar}`));
        process.exit(1);
      }
      console.log(chalk.green(`✅ ${envVar} is set`));
    }

    // Check gas price
    const gasPrice = await this.signer.getGasPrice();
    const gasPriceGwei = ethers.utils.formatUnits(gasPrice, 'gwei');
    
    console.log(chalk.yellow(`Current gas price: ${gasPriceGwei} gwei`));
    
    if (parseFloat(gasPriceGwei) > 50) {
      const { proceed } = await inquirer.prompt([{
        type: 'confirm',
        name: 'proceed',
        message: 'Gas price is high. Continue with deployment?',
        default: false
      }]);
      
      if (!proceed) {
        console.log(chalk.yellow('Deployment cancelled due to high gas price'));
        process.exit(0);
      }
    }

    // Check contract compilation
    try {
      const artifacts = [
        'StreamerRegistry',
        'TippingContract', 
        'CrossChainTippingBridge'
      ];

      for (const contractName of artifacts) {
        const artifactPath = path.join(__dirname, `../artifacts/contracts/${contractName}.sol/${contractName}.json`);
        if (!fs.existsSync(artifactPath)) {
          console.log(chalk.red(`❌ Contract artifact not found: ${contractName}`));
          console.log(chalk.yellow('Run: npx hardhat compile'));
          process.exit(1);
        }
        console.log(chalk.green(`✅ ${contractName} compiled`));
      }
    } catch (error) {
      console.log(chalk.red(`❌ Compilation check failed: ${error.message}`));
      process.exit(1);
    }

    console.log(chalk.green('✅ All pre-deployment checks passed\n'));
  }

  async deployContract(contractName, constructorArgs = []) {
    console.log(chalk.blue(`📄 Deploying ${contractName}...`));
    
    try {
      // Get contract factory
      const ContractFactory = await ethers.getContractFactory(contractName);
      
      // Estimate gas
      const deployTransaction = ContractFactory.getDeployTransaction(...constructorArgs);
      const gasEstimate = await this.signer.estimateGas(deployTransaction);
      const gasPrice = await this.signer.getGasPrice();
      const deploymentCost = gasEstimate.mul(gasPrice);
      
      console.log(chalk.yellow(`Estimated gas: ${gasEstimate.toString()}`));
      console.log(chalk.yellow(`Estimated cost: ${ethers.utils.formatEther(deploymentCost)} ETH`));

      // Deploy contract
      const contract = await ContractFactory.deploy(...constructorArgs, {
        gasLimit: gasEstimate.mul(120).div(100), // Add 20% buffer
        gasPrice: gasPrice
      });

      console.log(chalk.yellow(`Transaction sent: ${contract.deployTransaction.hash}`));
      console.log(chalk.yellow('Waiting for confirmation...'));

      // Wait for deployment
      await contract.deployed();
      
      const receipt = await contract.deployTransaction.wait(NETWORKS[this.network].confirmations);
      
      console.log(chalk.green(`✅ ${contractName} deployed at: ${contract.address}`));
      console.log(chalk.green(`Gas used: ${receipt.gasUsed.toString()}\n`));

      // Store deployment info
      this.deployedContracts[contractName] = {
        address: contract.address,
        transactionHash: contract.deployTransaction.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        constructorArgs
      };

      this.deploymentLog.push({
        contractName,
        address: contract.address,
        network: this.network,
        timestamp: new Date().toISOString(),
        transactionHash: contract.deployTransaction.hash
      });

      return contract;

    } catch (error) {
      console.log(chalk.red(`❌ Failed to deploy ${contractName}: ${error.message}`));
      throw error;
    }
  }

  async deployAllContracts() {
    console.log(chalk.blue('📚 Starting contract deployment...\n'));

    const contractsTodeploy = Object.entries(DEPLOYMENT_CONFIG.contracts)
      .sort(([, a], [, b]) => a.order - b.order);

    for (const [contractName, config] of contractsTodeploy) {
      // Resolve constructor arguments
      const constructorArgs = config.constructor.map(arg => {
        switch (arg) {
          case 'PLATFORM_WALLET':
            return process.env.PLATFORM_WALLET_ADDRESS;
          case 'STREAMER_REGISTRY':
            return this.deployedContracts.StreamerRegistry?.address;
          case 'THIRDWEB_BRIDGE':
            return process.env.THIRDWEB_BRIDGE_ADDRESS;
          case 'SWAP_ROUTER':
            return process.env.UNISWAP_ROUTER_ADDRESS;
          default:
            return arg;
        }
      });

      await this.deployContract(contractName, constructorArgs);
      
      // Add delay between deployments to avoid nonce issues
      await new Promise(resolve => setTimeout(resolve, 10000));
    }

    console.log(chalk.green('🎉 All contracts deployed successfully!\n'));
  }

  async verifyContracts() {
    console.log(chalk.blue('🔍 Starting contract verification...\n'));

    for (const [contractName, deployment] of Object.entries(this.deployedContracts)) {
      try {
        console.log(chalk.blue(`Verifying ${contractName}...`));
        
        // Run hardhat verify
        const { spawn } = require('child_process');
        
        const args = [
          'verify',
          '--network', this.network,
          deployment.address,
          ...deployment.constructorArgs
        ];

        await new Promise((resolve, reject) => {
          const process = spawn('npx', ['hardhat', ...args], {
            stdio: 'inherit',
            env: { ...process.env, ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY }
          });

          process.on('close', (code) => {
            if (code === 0) {
              console.log(chalk.green(`✅ ${contractName} verified\n`));
              resolve();
            } else {
              console.log(chalk.yellow(`⚠️ ${contractName} verification failed (code ${code})\n`));
              resolve(); // Continue with other contracts
            }
          });

          process.on('error', (error) => {
            console.log(chalk.yellow(`⚠️ ${contractName} verification error: ${error.message}\n`));
            resolve(); // Continue with other contracts
          });
        });

      } catch (error) {
        console.log(chalk.yellow(`⚠️ ${contractName} verification failed: ${error.message}\n`));
      }
    }
  }

  async setupInitialConfiguration() {
    console.log(chalk.blue('⚙️ Setting up initial configuration...\n'));

    try {
      // Initialize contracts
      const StreamerRegistry = await ethers.getContractAt(
        'StreamerRegistry',
        this.deployedContracts.StreamerRegistry.address
      );

      const TippingContract = await ethers.getContractAt(
        'TippingContract',
        this.deployedContracts.TippingContract.address
      );

      // Setup initial configuration if needed
      console.log(chalk.yellow('Setting up contract configurations...'));

      // Add any initial setup calls here
      // Example: Setting up initial streamers, configuring parameters, etc.

      console.log(chalk.green('✅ Initial configuration completed\n'));

    } catch (error) {
      console.log(chalk.red(`❌ Configuration setup failed: ${error.message}`));
      throw error;
    }
  }

  async saveDeploymentInfo() {
    console.log(chalk.blue('💾 Saving deployment information...\n'));

    const deploymentInfo = {
      network: this.network,
      chainId: NETWORKS[this.network].chainId,
      deployedAt: new Date().toISOString(),
      deployer: this.signer.address,
      contracts: this.deployedContracts,
      log: this.deploymentLog
    };

    // Save to deployments directory
    const deploymentsDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const filename = `${this.network}-${Date.now()}.json`;
    const filepath = path.join(deploymentsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
    console.log(chalk.green(`✅ Deployment info saved to: ${filepath}`));

    // Save latest deployment info
    const latestFilepath = path.join(deploymentsDir, `${this.network}-latest.json`);
    fs.writeFileSync(latestFilepath, JSON.stringify(deploymentInfo, null, 2));
    console.log(chalk.green(`✅ Latest deployment info saved to: ${latestFilepath}\n`));

    // Generate environment variables file
    const envVars = Object.entries(this.deployedContracts)
      .map(([name, deployment]) => `${name.toUpperCase()}_ADDRESS=${deployment.address}`)
      .join('\n');

    const envFilepath = path.join(deploymentsDir, `${this.network}.env`);
    fs.writeFileSync(envFilepath, envVars);
    console.log(chalk.green(`✅ Environment variables saved to: ${envFilepath}\n`));

    return deploymentInfo;
  }

  async generateReport() {
    console.log(chalk.blue('📊 Generating deployment report...\n'));

    const totalGasUsed = Object.values(this.deployedContracts)
      .reduce((total, deployment) => total + parseInt(deployment.gasUsed), 0);

    const gasPrice = await this.signer.getGasPrice();
    const totalCost = ethers.BigNumber.from(totalGasUsed).mul(gasPrice);

    console.log(chalk.cyan('📋 DEPLOYMENT SUMMARY'));
    console.log(chalk.cyan('═'.repeat(50)));
    console.log(chalk.white(`Network: ${NETWORKS[this.network].name}`));
    console.log(chalk.white(`Deployer: ${this.signer.address}`));
    console.log(chalk.white(`Total Gas Used: ${totalGasUsed.toLocaleString()}`));
    console.log(chalk.white(`Total Cost: ${ethers.utils.formatEther(totalCost)} ETH`));
    console.log();

    console.log(chalk.cyan('📄 DEPLOYED CONTRACTS'));
    console.log(chalk.cyan('═'.repeat(50)));
    
    for (const [contractName, deployment] of Object.entries(this.deployedContracts)) {
      console.log(chalk.white(`${contractName}:`));
      console.log(chalk.gray(`  Address: ${deployment.address}`));
      console.log(chalk.gray(`  TX Hash: ${deployment.transactionHash}`));
      console.log(chalk.gray(`  Gas Used: ${parseInt(deployment.gasUsed).toLocaleString()}`));
      console.log();
    }

    console.log(chalk.cyan('🔗 NEXT STEPS'));
    console.log(chalk.cyan('═'.repeat(50)));
    console.log(chalk.white('1. Update frontend environment variables'));
    console.log(chalk.white('2. Update API configuration'));
    console.log(chalk.white('3. Run integration tests'));
    console.log(chalk.white('4. Deploy frontend and API services'));
    console.log(chalk.white('5. Monitor deployment health'));
    console.log();
  }

  async run() {
    try {
      await this.init();
      await this.deployAllContracts();
      
      // Ask if user wants to verify contracts
      const { shouldVerify } = await inquirer.prompt([{
        type: 'confirm',
        name: 'shouldVerify',
        message: 'Verify contracts on Etherscan?',
        default: true
      }]);

      if (shouldVerify && process.env.ETHERSCAN_API_KEY) {
        await this.verifyContracts();
      }

      await this.setupInitialConfiguration();
      const deploymentInfo = await this.saveDeploymentInfo();
      await this.generateReport();

      console.log(chalk.green('🎉 Deployment completed successfully!'));
      
      return deploymentInfo;

    } catch (error) {
      console.log(chalk.red(`❌ Deployment failed: ${error.message}`));
      console.log(chalk.red('Stack trace:'), error.stack);
      process.exit(1);
    }
  }
}

// Emergency pause script
async function emergencyPause() {
  console.log(chalk.red('🚨 EMERGENCY PAUSE ACTIVATED'));
  
  const [signer] = await ethers.getSigners();
  const network = await signer.provider.getNetwork();
  
  // Load deployment info
  const deploymentPath = path.join(__dirname, `../deployments/${network.name}-latest.json`);
  
  if (!fs.existsSync(deploymentPath)) {
    console.log(chalk.red('❌ No deployment info found'));
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  
  // Pause all contracts that support pausing
  for (const [contractName, contractInfo] of Object.entries(deployment.contracts)) {
    try {
      const contract = await ethers.getContractAt(contractName, contractInfo.address);
      
      // Check if contract has pause function
      if (contract.pause) {
        console.log(chalk.yellow(`Pausing ${contractName}...`));
        const tx = await contract.pause();
        await tx.wait();
        console.log(chalk.green(`✅ ${contractName} paused`));
      }
    } catch (error) {
      console.log(chalk.yellow(`⚠️ Could not pause ${contractName}: ${error.message}`));
    }
  }

  console.log(chalk.red('🚨 Emergency pause completed'));
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--emergency-pause')) {
    emergencyPause();
  } else {
    const manager = new DeploymentManager();
    manager.run();
  }
}

module.exports = { DeploymentManager, emergencyPause };