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
  
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing
  
  return {
    result: `Processed input: ${JSON.stringify(input)}`,
    confidence: 0.95,
    timestamp: new Date().toISOString()
  };
}

function calculateComputeUnits(input: any, output: any): number {
  
  const inputSize = JSON.stringify(input).length;
  const outputSize = JSON.stringify(output).length;
  return Math.ceil((inputSize + outputSize) / 1000);
}

app.listen(PORT, () => {
  console.log(` Agent Runtime Server running on port ${PORT}`);
  console.log(` SGX Mode: ${process.env.SGX_MODE || 'SW'}`);
  console.log(` ZK Circuits: ${process.env.ZK_CIRCUIT_PATH || './circuits'}`);
});


