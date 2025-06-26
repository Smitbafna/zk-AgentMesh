import { NextRequest, NextResponse } from 'next/server';
import { PinataIPFSStorage } from '@zk-agentmesh/ipfs-storage';

const ipfsStorage = new PinataIPFSStorage(
  process.env.PINATA_API_KEY!,
  process.env.PINATA_API_SECRET!
);

// GET /api/agents/[id] - Get specific agent
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentRegistry = await ipfsStorage.getAgentRegistry(params.id);
    
    if (!agentRegistry) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: agentRegistry,
    });
  } catch (error) {
    console.error('Error getting agent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get agent' },
      { status: 500 }
    );
  }
}

// PUT /api/agents/[id] - Update agent registry
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updateData = await request.json();
    
    // Get current registry
    const currentRegistry = await ipfsStorage.getAgentRegistry(params.id);
    if (!currentRegistry) {
      return NextResponse.json(
        { success: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Merge updates
    const updatedRegistry = {
      ...currentRegistry,
      ...updateData,
      agent: {
        ...currentRegistry.agent,
        ...updateData.agent,
        updatedAt: new Date().toISOString(),
      },
    };

    const newRegistryHash = await ipfsStorage.pinJSON(
      updatedRegistry,
      `agent-${params.id}-updated-${Date.now()}`
    );

    return NextResponse.json({
      success: true,
      data: {
        agentId: params.id,
        registryHash: newRegistryHash,
        ipfsUrl: `https://gateway.pinata.cloud/ipfs/${newRegistryHash}`,
      },
    });
  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update agent' },
      { status: 500 }
    );
  }
}
