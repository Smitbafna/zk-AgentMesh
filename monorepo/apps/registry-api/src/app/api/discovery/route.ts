import { NextRequest, NextResponse } from 'next/server';
import { PinataIPFSStorage } from '@zk-agentmesh/ipfs-storage';

const ipfsStorage = new PinataIPFSStorage(
  process.env.PINATA_API_KEY!,
  process.env.PINATA_API_SECRET!
);

// GET /api/discovery - Enhanced discovery endpoint
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
    
    // Enhance with additional metadata
    const enhancedAgents = await Promise.all(
      agents.map(async (agent: any) => {
        try {
          const fullRegistry = await ipfsStorage.getData(agent.registryHash);
          return {
            ...agent,
            proofCount: fullRegistry.proofs?.length || 0,
            dependencyCount: fullRegistry.dependencies?.length || 0,
            pricePerCall: fullRegistry.paymentConfig?.pricePerCall,
          };
        } catch {
          return agent;
        }
      })
    );

    return NextResponse.json({
      success: true,
      data: enhancedAgents,
      count: enhancedAgents.length,
      filters: {
        availableTags: [...new Set(enhancedAgents.flatMap(a => a.tags || []))],
        developers: [...new Set(enhancedAgents.map(a => a.developer))],
      },
    });
  } catch (error) {
    console.error('Error in discovery:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to discover agents' },
      { status: 500 }
    );
  }
}