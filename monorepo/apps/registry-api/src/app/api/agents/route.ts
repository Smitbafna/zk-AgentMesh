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
