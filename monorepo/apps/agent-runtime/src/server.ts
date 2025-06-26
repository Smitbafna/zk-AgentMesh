// apps/agent-runtime/src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { ZKProofEngine } from '@zk-agentmesh/zk-circuits';
import { PaymentProcessor } from '@zk-agentmesh/payment-layer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize ZK and Payment systems
const zkEngine = new ZKProofEngine(process.env.ZK_CIRCUIT_PATH || './circuits');
const paymentProcessor = new PaymentProcessor({
  x402PayEndpoint: process.env.X402_PAY_ENDPOINT,
  cdpWalletConfig: {
    projectId: process.env.CDP_PROJECT_ID,
    privateKey: process.env.CDP_PRIVATE_KEY
  }
});

interface AgentRequest {
  agentId: string;
  input: any;
  payment?: {
    signature: string;
    amount: string;
    token: string;
  };
}

interface AgentResponse {
  output: any;
  proofs: {
    qualityProof: string;
    ethicsProof: string;
    complianceProof: string;
  };
  executionMetrics: {
    latency: number;
    computeUnits: number;
    proofGenTime: number;
  };
}

// Agent execution endpoint
app.post('/agents/:agentId/execute', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { input, payment }: AgentRequest = req.body;

    // Verify payment if required
    if (payment) {
      const paymentValid = await paymentProcessor.verifyPayment(payment);
      if (!paymentValid) {
        return res.status(402).json({ error: 'Payment verification failed' });
      }
    }

    // Load agent configuration
    const agentConfig = await loadAgentConfig(agentId);
    if (!agentConfig) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Execute agent with ZK proof generation
    const startTime = Date.now();
    
    // Run the agent logic (this would be the actual AI model execution)
    const output = await executeAgent(agentConfig, input);
    
    // Generate ZK proofs for quality, ethics, and compliance
    const proofStartTime = Date.now();
    const proofs = await zkEngine.generateProofs({
      agentId,
      input,
      output,
      trainingMetadata: agentConfig.trainingMetadata
    });
    const proofGenTime = Date.now() - proofStartTime;

    const response: AgentResponse = {
      output,
      proofs,
      executionMetrics: {
        latency: Date.now() - startTime,
        computeUnits: calculateComputeUnits(input, output),
        proofGenTime
      }
    };

    // Process revenue split if payment was made
    if (payment) {
      await paymentProcessor.distributeRevenue({
        agentId,
        totalAmount: payment.amount,
        splits: agentConfig.revenueSplits
      });
    }

    res.json(response);
  } catch (error) {
    console.error('Agent execution error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    zkEngine: zkEngine.isReady(),
    sgxEnabled: process.env.SGX_MODE === 'HW'
  });
});

// Agent metadata endpoint
app.get('/agents/:agentId/metadata', async (req, res) => {
  try {
    const { agentId } = req.params;
    const config = await loadAgentConfig(agentId);
    
    if (!config) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    res.json({
      id: agentId,
      name: config.name,
      description: config.description,
      capabilities: config.capabilities,
      pricing: config.pricing,
      proofTypes: config.supportedProofTypes
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load agent metadata' });
  }
});

async function loadAgentConfig(agentId: string) {
  // This would load from your registry or local config
  // For now, return a mock configuration
  return {
    id: agentId,
    name: `Agent ${agentId}`,
    description: 'A verified AI agent',
    capabilities: ['text-generation', 'analysis'],
    pricing: { perCall: '0.001', currency: 'USDC' },
    supportedProofTypes: ['quality', 'ethics', 'compliance'],
    trainingMetadata: {
      dataset: 'curated-v1',
      metrics: { accuracy: 0.95, bias_score: 0.1 }
    },
    revenueSplits: [
      { recipient: '0x...', percentage: 70 }, // Developer
      { recipient: '0x...', percentage: 20 }, // Trainer
      { recipient: '0x...', percentage: 10 }  // Platform
    ]
  };
}

async function executeAgent(config: any, input: any) {
  // This is where you'd actually run the AI model
  // For now, return a mock response
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing
  
  return {
    result: `Processed input: ${JSON.stringify(input)}`,
    confidence: 0.95,
    timestamp: new Date().toISOString()
  };
}

function calculateComputeUnits(input: any, output: any): number {
  // Simple heuristic for compute unit calculation
  const inputSize = JSON.stringify(input).length;
  const outputSize = JSON.stringify(output).length;
  return Math.ceil((inputSize + outputSize) / 1000);
}

app.listen(PORT, () => {
  console.log(`🚀 Agent Runtime Server running on port ${PORT}`);
  console.log(`📊 SGX Mode: ${process.env.SGX_MODE || 'SW'}`);
  console.log(`🔐 ZK Circuits: ${process.env.ZK_CIRCUIT_PATH || './circuits'}`);
});

---
// apps/registry-api/src/app/api/agents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Contract ABI for the registry
const REGISTRY_ABI = [
  "function getAgent(string memory agentId) external view returns (address owner, string memory metadataHash, uint256 verificationLevel)",
  "function registerAgent(string memory agentId, string memory metadataHash, bytes32[] memory proofHashes) external",
  "function updateProofs(string memory agentId, bytes32[] memory proofHashes) external"
];

const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
const registryContract = new ethers.Contract(
  process.env.REGISTRY_CONTRACT_ADDRESS!,
  REGISTRY_ABI,
  provider
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const minVerificationLevel = searchParams.get('minVerification');
    const maxPrice = searchParams.get('maxPrice');

    // Build query filters
    const where: any = {};
    if (category) where.category = category;
    if (minVerificationLevel) where.verificationLevel = { gte: parseInt(minVerificationLevel) };
    if (maxPrice) where.pricePerCall = { lte: parseFloat(maxPrice) };

    const agents = await prisma.agent.findMany({
      where,
      include: {
        proofs: true,
        dependencies: true
      },
      orderBy: {
        verificationLevel: 'desc'
      }
    });

    return NextResponse.json({
      agents: agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        category: agent.category,
        owner: agent.owner,
        pricePerCall: agent.pricePerCall,
        verificationLevel: agent.verificationLevel,
        proofTypes: agent.proofs.map(p => p.proofType),
        dependencies: agent.dependencies.map(d => d.dependsOnAgentId),
        endpoint: agent.endpoint,
        createdAt: agent.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      agentId,
      name,
      description,
      category,
      owner,
      pricePerCall,
      endpoint,
      metadataHash,
      proofHashes,
      dependencies = []
    } = body;

    // Verify the agent is registered on-chain
    try {
      const onChainData = await registryContract.getAgent(agentId);
      if (onChainData.owner === ethers.ZeroAddress) {
        return NextResponse.json(
          { error: 'Agent not found on-chain registry' },
          { status: 404 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to verify on-chain registration' },
        { status: 400 }
      );
    }

    // Create agent record
    const agent = await prisma.agent.create({
      data: {
        id: agentId,
        name,
        description,
        category,
        owner,
        pricePerCall,
        endpoint,
        metadataHash,
        verificationLevel: proofHashes.length, // Simple verification scoring
        proofs: {
          create: proofHashes.map((hash: string, index: number) => ({
            proofType: ['quality', 'ethics', 'compliance'][index] || 'custom',
            proofHash: hash,
            verifiedAt: new Date()
          }))
        },
        dependencies: {
          create: dependencies.map((depId: string) => ({
            dependsOnAgentId: depId
          }))
        }
      },
      include: {
        proofs: true,
        dependencies: true
      }
    });

    return NextResponse.json({
      message: 'Agent registered successfully',
      agent: {
        id: agent.id,
        verificationLevel: agent.verificationLevel,
        proofCount: agent.proofs.length
      }
    });
  } catch (error) {
    console.error('Error registering agent:', error);
    return NextResponse.json(
      { error: 'Failed to register agent' },
      { status: 500 }
    );
  }
}

---
// packages/zk-circuits/src/index.ts
import { groth16 } from 'snarkjs';
import * as fs from 'fs';
import * as path from 'path';

export class ZKProofEngine {
  private circuitPath: string;
  private wasmPath: string;
  private zkeyPath: string;

  constructor(circuitBasePath: string) {
    this.circuitPath = circuitBasePath;
    this.wasmPath = path.join(circuitBasePath, 'build');
    this.zkeyPath = path.join(circuitBasePath, 'keys');
  }

  async generateProofs(params: {
    agentId: string;
    input: any;
    output: any;
    trainingMetadata: any;
  }) {
    const { agentId, input, output, trainingMetadata } = params;

    try {
      // Generate quality proof
      const qualityProof = await this.generateQualityProof({
        accuracy: trainingMetadata.metrics.accuracy,
        inputComplexity: this.calculateComplexity(input),
        outputQuality: this.assessOutputQuality(output)
      });

      // Generate ethics proof
      const ethicsProof = await this.generateEthicsProof({
        biasScore: trainingMetadata.metrics.bias_score,
        contentFlags: this.checkContentFlags(input, output),
        fairnessMetrics: this.calculateFairness(output)
      });

      // Generate compliance proof
      const complianceProof = await this.generateComplianceProof({
        dataSource: trainingMetadata.dataset,
        privacyCompliance: this.checkPrivacyCompliance(input),
        regulatoryFlags: this.checkRegulatory(output)
      });

      return {
        qualityProof: qualityProof.proof,
        ethicsProof: ethicsProof.proof,
        complianceProof: complianceProof.proof
      };
    } catch (error) {
      console.error('Proof generation failed:', error);
      throw new Error('Failed to generate ZK proofs');
    }
  }

  private async generateQualityProof(signals: any) {
    const wasmFile = path.join(this.wasmPath, 'quality.wasm');
    const zkeyFile = path.join(this.zkeyPath, 'quality_final.zkey');

    // Convert signals to circuit inputs
    const input = {
      accuracy: Math.floor(signals.accuracy * 1000), // Scale to integer
      inputComplexity: signals.inputComplexity,
      outputQuality: signals.outputQuality
    };

    const { proof, publicSignals } = await groth16.fullProve(
      input,
      wasmFile,
      zkeyFile
    );

    return {
      proof: this.formatProof(proof),
      publicSignals
    };
  }

  private async generateEthicsProof(signals: any) {
    const wasmFile = path.join(this.wasmPath, 'ethics.wasm');
    const zkeyFile = path.join(this.zkeyPath, 'ethics_final.zkey');

    const input = {
      biasScore: Math.floor(signals.biasScore * 1000),
      contentFlags: signals.contentFlags,
      fairnessScore: signals.fairnessMetrics
    };

    const { proof, publicSignals } = await groth16.fullProve(
      input,
      wasmFile,
      zkeyFile
    );

    return {
      proof: this.formatProof(proof),
      publicSignals
    };
  }

  private async generateComplianceProof(signals: any) {
    const wasmFile = path.join(this.wasmPath, 'compliance.wasm');
    const zkeyFile = path.join(this.zkeyPath, 'compliance_final.zkey');

    const input = {
      dataSourceHash: this.hashString(signals.dataSource),
      privacyScore: signals.privacyCompliance ? 1 : 0,
      regulatoryFlags: signals.regulatoryFlags
    };

    const { proof, publicSignals } = await groth16.fullProve(
      input,
      wasmFile,
      zkeyFile
    );

    return {
      proof: this.formatProof(proof),
      publicSignals
    };
  }

  private formatProof(proof: any): string {
    return JSON.stringify({
      pi_a: proof.pi_a,
      pi_b: proof.pi_b,
      pi_c: proof.pi_c,
      protocol: "groth16",
      curve: "bn128"
    });
  }

  private calculateComplexity(input: any): number {
    // Simple complexity metric based on input size and structure
    const inputStr = JSON.stringify(input);
    return Math.min(inputStr.length / 100, 1000); // Normalize to reasonable range
  }

  private assessOutputQuality(output: any): number {
    // Quality assessment heuristics
    if (output.confidence && typeof output.confidence === 'number') {
      return Math.floor(output.confidence * 1000);
    }
    return 800; // Default quality score
  }

  private checkContentFlags(input: any, output: any): number {
    // Content safety checks - return 0 for safe, 1 for flagged
    const content = JSON.stringify(input) + JSON.stringify(output);
    const flaggedPatterns = ['violence', 'hate', 'explicit'];
    
    for (const pattern of flaggedPatterns) {
      if (content.toLowerCase().includes(pattern)) {
        return 1;
      }
    }
    return 0;
  }

  private calculateFairness(output: any): number {
    // Simple fairness metric - would be more sophisticated in production
    return 900; // Placeholder fairness score
  }

  private checkPrivacyCompliance(input: any): boolean {
    // Check for PII or sensitive data
    const inputStr = JSON.stringify(input).toLowerCase();
    const piiPatterns = ['ssn', 'social security', 'credit card', 'password'];
    
    return !piiPatterns.some(pattern => inputStr.includes(pattern));
  }

  private checkRegulatory(output: any): number {
    // Regulatory compliance checks
    return 0; // 0 = compliant, 1 = violation
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  isReady(): boolean {
    // Check if circuit files exist
    const requiredFiles = [
      'quality.wasm',
      'ethics.wasm', 
      'compliance.wasm'
    ];
    
    return requiredFiles.every(file => 
      fs.existsSync(path.join(this.wasmPath, file))
    );
  }
}

---
// packages/payment-layer/src/index.ts
import { ethers } from 'ethers';

export interface PaymentConfig {
  x402PayEndpoint?: string;
  cdpWalletConfig: {
    projectId: string;
    privateKey: string;
  };
}

export interface PaymentVerification {
  signature: string;
  amount: string;
  token: string;
}

export interface RevenueSplit {
  recipient: string;
  percentage: number;
}

export class PaymentProcessor {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private x402PayEndpoint: string;

  constructor(config: PaymentConfig) {
    this.provider = new ethers.JsonRpcProvider(
      process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_KEY'
    );
    this.wallet = new ethers.Wallet(config.cdpWalletConfig.privateKey, this.provider);
    this.x402PayEndpoint = config.x402PayEndpoint || 'https://x402pay.com/api';
  }

  async verifyPayment(payment: PaymentVerification): Promise<boolean> {
    try {
      // Verify x402pay signature
      const response = await fetch(`${this.x402PayEndpoint}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signature: payment.signature,
          amount: payment.amount,
          token: payment.token
        })
      });

      const result = await response.json();
      return result.valid === true;
    } catch (error) {
      console.error('Payment verification failed:', error);
      return false;
    }
  }

  async distributeRevenue(params: {
    agentId: string;
    totalAmount: string;
    splits: RevenueSplit[];
  }): Promise<void> {
    const { totalAmount, splits } = params;
    const totalAmountWei = ethers.parseEther(totalAmount);

    try {
      // Validate splits add up to 100%
      const totalPercentage = splits.reduce((sum, split) => sum + split.percentage, 0);
      if (totalPercentage !== 100) {
        throw new Error('Revenue splits must total 100%');
      }

      // Execute transfers
      for (const split of splits) {
        const amount = (totalAmountWei * BigInt(split.percentage)) / BigInt(100);
        
        const tx = await this.wallet.sendTransaction({
          to: split.recipient,
          value: amount,
          gasLimit: 21000
        });

        console.log(`Revenue split sent: ${split.percentage}% to ${split.recipient}, tx: ${tx.hash}`);
      }
    } catch (error) {
      console.error('Revenue distribution failed:', error);
      throw error;
    }
  }

  async estimateGas(splits: RevenueSplit[]): Promise<string> {
    // Estimate gas for revenue distribution
    const gasPerTransfer = 21000;
    const totalGas = gasPerTransfer * splits.length;
    const gasPrice = await this.provider.getFeeData();
    
    return ethers.formatEther((gasPrice.gasPrice || 0n) * BigInt(totalGas));
  }
}

---
// packages/contracts/contracts/AgentRegistry.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract AgentRegistry is Ownable, ReentrancyGuard {
    struct Agent {
        address owner;
        string metadataHash;
        bytes32[] proofHashes;
        uint256 verificationLevel;
        uint256 registrationTime;
        bool isActive;
    }

    struct ProofInheritance {
        string fromAgent;
        bytes32 proofHash;
        uint256 inheritanceTime;
    }

    mapping(string => Agent) public agents;
    mapping(string => ProofInheritance[]) public proofInheritances;
    mapping(string => mapping(address => uint256)) public proofRoyalties;
    
    string[] public registeredAgents;
    
    event AgentRegistered(
        string indexed agentId,
        address indexed owner,
        string metadataHash,
        uint256 verificationLevel
    );
    
    event ProofUpdated(
        string indexed agentId,
        bytes32[] proofHashes,
        uint256 newVerificationLevel
    );
    
    event ProofInherited(
        string indexed fromAgent,
        string indexed toAgent,
        bytes32 proofHash
    );

    constructor() {}

    function registerAgent(
        string memory agentId,
        string memory metadataHash,
        bytes32[] memory proofHashes
    ) external {
        require(bytes(agentId).length > 0, "Agent ID cannot be empty");
        require(agents[agentId].owner == address(0), "Agent already registered");
        
        agents[agentId] = Agent({
            owner: msg.sender,
            metadataHash: metadataHash,
            proofHashes: proofHashes,
            verificationLevel: proofHashes.length,
            registrationTime: block.timestamp,
            isActive: true
        });
        
        registeredAgents.push(agentId);
        
        emit AgentRegistered(agentId, msg.sender, metadataHash, proofHashes.length);
    }

    function updateProofs(
        string memory agentId,
        bytes32[] memory proofHashes
    ) external {
        require(agents[agentId].owner == msg.sender, "Only agent owner can update proofs");
        require(agents[agentId].isActive, "Agent is not active");
        
        agents[agentId].proofHashes = proofHashes;
        agents[agentId].verificationLevel = proofHashes.length;
        
        emit ProofUpdated(agentId, proofHashes, proofHashes.length);
    }

    function inheritProof(
        string memory fromAgent,
        string memory toAgent,
        bytes32 proofHash
    ) external {
        require(agents[toAgent].owner == msg.sender, "Only target agent owner can inherit");
        require(agents[fromAgent].isActive, "Source agent is not active");
        require(agents[toAgent].isActive, "Target agent is not active");
        
        // Verify the proof exists in the source agent
        bool proofExists = false;
        bytes32[] memory sourceProofs = agents[fromAgent].proofHashes;
        for (uint i = 0; i < sourceProofs.length; i++) {
            if (sourceProofs[i] == proofHash) {
                proofExists = true;
                break;
            }
        }
        require(proofExists, "Proof does not exist in source agent");
        
        // Add inheritance record
        proofInheritances[toAgent].push(ProofInheritance({
            fromAgent: fromAgent,
            proofHash: proofHash,
            inheritanceTime: block.timestamp
        }));
        
        // Set up royalty for original proof creator
        proofRoyalties[fromAgent][agents[fromAgent].owner] += 1;
        
        emit ProofInherited(fromAgent, toAgent, proofHash);
    }

    function getAgent(string memory agentId) external view returns (
        address owner,
        string memory metadataHash,
        uint256 verificationLevel
    ) {
        Agent memory agent = agents[agentId];
        return (agent.owner, agent.metadataHash, agent.verificationLevel);
    }

    function getAgentProofs(string memory agentId) external view returns (bytes32[] memory) {
        return agents[agentId].proofHashes;
    }

    function getProofInheritances(string memory agentId) external view returns (ProofInheritance[] memory) {
        return proofInheritances[agentId];
    }

    function getRegisteredAgents() external view returns (string[] memory) {
        return registeredAgents;
    }

    function deactivateAgent(string memory agentId) external {
        require(agents[agentId].owner == msg.sender, "Only agent owner can deactivate");
        agents[agentId].isActive = false;
    }
}

---
// Setup and deployment scripts
// scripts/setup.sh
#!/bin/bash

echo " Setting up ZK-AgentMesh..."

# Install dependencies
echo " Installing dependencies..."
npm install

# Build ZK circuits
echo " Building ZK circuits..."
turbo run zk:generate

# Build all packages
echo " Building packages..."
turbo run build

# Setup local database
echo "🗄️  Setting up database..."
docker-compose up -d postgres
sleep 5

# Run database migrations
cd apps/registry-api
npx prisma migrate dev --name init
npx prisma generate
cd ../..

echo " Setup complete!"
echo "To start development: docker-compose up"
echo " To deploy to Akash: turbo run akash:deploy"

---
// scripts/deploy-akash.sh
#!/bin/bash

echo "🚀 Deploying ZK-AgentMesh to Akash Network..."

# Build Docker images
echo "🐳 Building Docker images..."
turbo run docker:build

# Tag images for registry
docker tag zk-agent-runtime:latest your-registry.com/zk-agent-runtime:latest
docker tag zk-registry-api:latest your-registry.com/zk-registry-api:latest
docker tag zk-frontend:latest your-registry.com/zk-frontend:latest

# Push to registry
echo " Pushing images to registry..."
docker push your-registry.com/zk-agent-runtime:latest
docker push your-registry.com/zk-registry-api:latest
docker push your-registry.com/zk-frontend:latest

# Deploy to Akash
echo " Deploying to Akash..."
cd apps/agent-runtime
akash tx deployment create akash-manifest.yml --from wallet --chain-id akashnet-2 --node https://rpc.akash.forbole.com:443 --gas-prices 0.025uakt --gas auto --gas-adjustment 1.5

cd ../registry-api
akash tx deployment create registry-manifest.yml --from wallet --chain-id akashnet-2 --node https://rpc.akash.forbole.com:443 --gas-prices 0.025uakt --gas auto --gas-adjustment 1.5

cd ../web
akash tx deployment create frontend-manifest.yml --from wallet --chain-id akashnet-2 --node https://rpc.akash.forbole.com:443 --gas-prices 0.025uakt --gas auto --gas-adjustment 1.5

echo "Deployment initiated!"
echo " Check deployment status with: akash query deployment list --owner <your-address>"