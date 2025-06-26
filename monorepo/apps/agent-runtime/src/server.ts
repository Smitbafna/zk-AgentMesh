// apps/agent-runtime/src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PinataIPFSStorage } from '@zk-agentmesh/ipfs-storage';
import { ZKProofEngine } from '@zk-agentmesh/zk-circuits';
import { PaymentProcessor } from '@zk-agentmesh/payment-layer';
import { verifySignature } from './utils/crypto';
import { rateLimiter } from './middleware/rateLimiter';

const app = express();
const port = process.env.PORT || 3001;

// Initialize services
const ipfsStorage = new PinataIPFSStorage(
  process.env.PINATA_API_KEY!,
  process.env.PINATA_API_SECRET!
);

const zkEngine = new ZKProofEngine();
const paymentProcessor = new PaymentProcessor({
  x402payEndpoint: process.env.X402PAY_ENDPOINT!,
  cdpWalletAddress: process.env.CDP_WALLET_ADDRESS!,
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Agent registration endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { agentMetadata, trainingData, paymentConfig } = req.body;

    // Validate input
    if (!agentMetadata?.id || !agentMetadata?.name) {
      return res.status(400).json({
        success: false,
        error: 'Agent ID and name are required',
      });
    }

    // Generate initial proofs during registration
    console.log('Generating ZK proofs for agent registration...');
    const proofs = await Promise.all([
      zkEngine.generateQualityProof(trainingData),
      zkEngine.generateEthicsProof(agentMetadata.ethicsConfig),
      zkEngine.generateComplianceProof(agentMetadata.complianceRules),
    ]);

    // Store proofs on IPFS
    const proofHashes = await Promise.all(
      proofs.map(async (proof, index) => {
        const proofTypes = ['quality', 'ethics', 'compliance'];
        return await ipfsStorage.submitProof(agentMetadata.id, {
          agentId: agentMetadata.id,
          proofType: proofTypes[index] as any,
          proofHash: proof.hash,
          circuitName: proof.circuitName,
          publicInputs: proof.publicInputs,
          verificationKey: proof.verificationKey,
          createdAt: new Date().toISOString(),
        });
      })
    );

    // Create registry entry
    const registryData = {
      agent: {
        ...agentMetadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      proofs: proofHashes,
      paymentConfig: paymentConfig || {
        pricePerCall: '0.001',
        revenueShares: {
          developer: 0.4,
          trainer: 0.3,
          verifier: 0.2,
          host: 0.1,
        },
      },
      dependencies: [],
    };

    const registryHash = await ipfsStorage.registerAgent(registryData);

    res.json({
      success: true,
      data: {
        agentId: agentMetadata.id,
        registryHash,
        proofHashes,
        ipfsUrl: `https://gateway.pinata.cloud/ipfs/${registryHash}`,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register agent',
    });
  }
});

// Agent execution endpoint with payment verification
app.post('/api/execute/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { input, paymentProof, signature } = req.body;

    // Get agent registry from IPFS
    const agentRegistry = await ipfsStorage.getAgentRegistry(agentId);
    if (!agentRegistry) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }

    // Verify payment
    const paymentValid = await paymentProcessor.verifyPayment(
      paymentProof,
      agentRegistry.paymentConfig.pricePerCall
    );

    if (!paymentValid) {
      return res.status(402).json({
        success: false,
        error: 'Payment verification failed',
      });
    }

    // Verify preconditions using stored proofs
    const proofVerifications = await Promise.all(
      agentRegistry.proofs.map(async (proofHash) => {
        try {
          const proof = await ipfsStorage.getData(proofHash);
          return await zkEngine.verifyProof(proof);
        } catch {
          return false;
        }
      })
    );

    if (!proofVerifications.every(Boolean)) {
      return res.status(400).json({
        success: false,
        error: 'Agent preconditions not met',
      });
    }

    // Execute agent logic (placeholder - integrate with your AI model)
    const result = await executeAgentLogic(agentId, input, agentRegistry);

    // Process payment distribution
    await paymentProcessor.distributeRevenue(
      paymentProof.amount,
      agentRegistry.paymentConfig.revenueShares
    );

    // Log execution for monitoring
    const executionLog = {
      agentId,
      timestamp: new Date().toISOString(),
      inputHash: hashInput(input),
      success: true,
      paymentAmount: paymentProof.amount,
    };

    // Store execution log on IPFS (optional, for transparency)
    await ipfsStorage.pinJSON(executionLog, `execution-${agentId}-${Date.now()}`);

    res.json({
      success: true,
      data: {
        result,
        executionId: executionLog.timestamp,
        proofVerifications: proofVerifications.length,
      },
    });
  } catch (error) {
    console.error('Execution error:', error);
    res.status(500).json({
      success: false,
      error: 'Agent execution failed',
    });
  }
});

// Proof generation endpoint for existing agents
app.post('/api/generate-proof/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { proofType, data, inheritFrom } = req.body;

    // Get existing agent registry
    const agentRegistry = await ipfsStorage.getAgentRegistry(agentId);
    if (!agentRegistry) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }

    // Generate new proof
    let proof;
    switch (proofType) {
      case 'quality':
        proof = await zkEngine.generateQualityProof(data);
        break;
      case 'ethics':
        proof = await zkEngine.generateEthicsProof(data);
        break;
      case 'compliance':
        proof = await zkEngine.generateComplianceProof(data);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid proof type',
        });
    }

    // Create proof record with inheritance
    const proofRecord = {
      agentId,
      proofType: proofType as any,
      proofHash: proof.hash,
      circuitName: proof.circuitName,
      publicInputs: proof.publicInputs,
      verificationKey: proof.verificationKey,
      createdAt: new Date().toISOString(),
      inheritedFrom: inheritFrom || [],
    };

    // Store proof on IPFS
    const proofHash = await ipfsStorage.submitProof(agentId, proofRecord);

    res.json({
      success: true,
      data: {
        proofHash,
        proofType,
        agentId,
        ipfsUrl: `https://gateway.pinata.cloud/ipfs/${proofHash}`,
      },
    });
  } catch (error) {
    console.error('Proof generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate proof',
    });
  }
});

// Proof inheritance endpoint
app.post('/api/inherit-proof/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { parentProofHash, adaptationData } = req.body;

    // Get parent proof
    const parentProof = await ipfsStorage.getData(parentProofHash);
    if (!parentProof) {
      return res.status(404).json({
        success: false,
        error: 'Parent proof not found',
      });
    }

    // Verify parent proof integrity
    const parentValid = await ipfsStorage.verifyProofIntegrity(parentProofHash);
    if (!parentValid) {
      return res.status(400).json({
        success: false,
        error: 'Parent proof is invalid',
      });
    }

    // Generate inherited proof
    const inheritedProof = await zkEngine.generateInheritedProof(
      parentProof,
      adaptationData
    );

    // Create new proof record
    const proofRecord = {
      agentId,
      proofType: parentProof.proofType,
      proofHash: inheritedProof.hash,
      circuitName: inheritedProof.circuitName,
      publicInputs: inheritedProof.publicInputs,
      verificationKey: inheritedProof.verificationKey,
      createdAt: new Date().toISOString(),
      inheritedFrom: [parentProofHash],
    };

    const newProofHash = await ipfsStorage.submitProof(agentId, proofRecord);

    // Update parent proof creator royalties
    await paymentProcessor.addRoyaltyBeneficiary(
      parentProof.agentId,
      agentId,
      0.1 // 10% royalty
    );

    res.json({
      success: true,
      data: {
        proofHash: newProofHash,
        parentProofHash,
        agentId,
        royaltyRate: 0.1,
      },
    });
  } catch (error) {
    console.error('Proof inheritance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to inherit proof',
    });
  }
});

// Agent composition endpoint
app.post('/api/compose/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { dependentAgents, compositionLogic } = req.body;

    // Verify all dependent agents exist and are valid
    const dependentRegistries = await Promise.all(
      dependentAgents.map(async (depAgentId: string) => {
        const registry = await ipfsStorage.getAgentRegistry(depAgentId);
        if (!registry) {
          throw new Error(`Dependent agent ${depAgentId} not found`);
        }
        return registry;
      })
    );

    // Get current agent registry
    const currentRegistry = await ipfsStorage.getAgentRegistry(agentId);
    if (!currentRegistry) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }

    // Create composed agent registry
    const composedRegistry = {
      ...currentRegistry,
      dependencies: dependentAgents,
      compositionLogic,
      updatedAt: new Date().toISOString(),
    };

    // Store updated registry
    const newRegistryHash = await ipfsStorage.pinJSON(
      composedRegistry,
      `agent-${agentId}-composed-${Date.now()}`
    );

    res.json({
      success: true,
      data: {
        agentId,
        registryHash: newRegistryHash,
        dependencies: dependentAgents,
        compositionLogic,
      },
    });
  } catch (error) {
    console.error('Composition error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compose agent',
    });
  }
});

// Agent discovery endpoint
app.get('/api/discover', async (req, res) => {
  try {
    const {
      name,
      developer,
      tags,
      proofTypes,
      minProofCount,
      maxPrice,
      sortBy = 'name',
      sortOrder = 'asc',
    } = req.query;

    const query = {
      name: name as string,
      developer: developer as string,
      tags: tags ? (tags as string).split(',') : undefined,
      proofTypes: proofTypes ? (proofTypes as string).split(',') : undefined,
    };

    let agents = await ipfsStorage.searchAgents(query);

    // Apply additional filters
    if (minProofCount) {
      agents = agents.filter(agent => agent.proofCount >= parseInt(minProofCount as string));
    }

    if (maxPrice) {
      agents = agents.filter(agent => 
        parseFloat(agent.pricePerCall || '0') <= parseFloat(maxPrice as string)
      );
    }

    // Sort results
    agents.sort((a, b) => {
      const modifier = sortOrder === 'desc' ? -1 : 1;
      switch (sortBy) {
        case 'name':
          return modifier * a.name.localeCompare(b.name);
        case 'price':
          return modifier * (parseFloat(a.pricePerCall || '0') - parseFloat(b.pricePerCall || '0'));
        case 'proofCount':
          return modifier * ((a.proofCount || 0) - (b.proofCount || 0));
        default:
          return 0;
      }
    });

    const totalCount = agents.length;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const paginatedAgents = agents.slice(offset, offset + limit);

    res.json({
      success: true,
      data: paginatedAgents,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Discovery error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to discover agents',
    });
  }
});

// Batch proof verification endpoint
app.post('/api/verify-proofs', async (req, res) => {
  try {
    const { proofHashes } = req.body;

    if (!Array.isArray(proofHashes)) {
      return res.status(400).json({
        success: false,
        error: 'proofHashes must be an array',
      });
    }

    const verificationResults = await Promise.all(
      proofHashes.map(async (hash: string) => {
        try {
          const isValid = await ipfsStorage.verifyProofIntegrity(hash);
          const proofData = await ipfsStorage.getData(hash);
          return {
            proofHash: hash,
            isValid,
            proofType: proofData.proofType,
            agentId: proofData.agentId,
          };
        } catch (error) {
          return {
            proofHash: hash,
            isValid: false,
            error: error.message,
          };
        }
      })
    );

    res.json({
      success: true,
      data: verificationResults,
      summary: {
        total: proofHashes.length,
        valid: verificationResults.filter(r => r.isValid).length,
        invalid: verificationResults.filter(r => !r.isValid).length,
      },
    });
  } catch (error) {
    console.error('Batch verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify proofs',
    });
  }
});

// Utility functions
async function executeAgentLogic(agentId: string, input: any, registry: any) {
  // Placeholder for actual agent execution logic
  // This would integrate with your AI model/inference engine
  return {
    output: `Processed input for agent ${agentId}`,
    timestamp: new Date().toISOString(),
    metadata: {
      inputSize: JSON.stringify(input).length,
      processingTime: Math.random() * 1000,
    },
  };
}

function hashInput(input: any): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256')
    .update(JSON.stringify(input))
    .digest('hex');
}

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Start server
app.listen(port, () => {
  console.log(` Agent Runtime Server running on port ${port}`);
  console.log(` IPFS Storage: ${process.env.PINATA_API_KEY ? 'Connected' : 'Not configured'}`);
  console.log(` Payment Layer: ${process.env.X402PAY_ENDPOINT ? 'Enabled' : 'Disabled'}`);
});

export default app;