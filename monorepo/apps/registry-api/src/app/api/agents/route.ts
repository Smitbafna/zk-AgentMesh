// apps/registry-api/src/app/api/agents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PinataIPFSStorage } from './ipfs-storage';

const ipfsStorage = new PinataIPFSStorage(
  process.env.PINATA_API_KEY!,
  process.env.PINATA_API_SECRET!
);

// GET /api/agents - Search and list agents
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = {
      name: searchParams.get('name') || undefined,
      developer: searchParams.get('developer') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      proofTypes: searchParams.get('proofTypes')?.split(',') || undefined,
    };

    const agents = await ipfsStorage.searchAgents(query);
    
    return NextResponse.json({
      success: true,
      data: agents,
      count: agents.length,
    });
  } catch (error) {
    console.error('Error searching agents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search agents' },
      { status: 500 }
    );
  }
}

// POST /api/agents - Register new agent
export async function POST(request: NextRequest) {
  try {
    const agentData = await request.json();
    
    // Validate required fields
    if (!agentData.agent?.id || !agentData.agent?.name) {
      return NextResponse.json(
        { success: false, error: 'Agent ID and name are required' },
        { status: 400 }
      );
    }

    const registryHash = await ipfsStorage.registerAgent(agentData);
    
    return NextResponse.json({
      success: true,
      data: {
        agentId: agentData.agent.id,
        registryHash,
        ipfsUrl: `https://gateway.pinata.cloud/ipfs/${registryHash}`,
      },
    });
  } catch (error) {
    console.error('Error registering agent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register agent' },
      { status: 500 }
    );
  }
}
