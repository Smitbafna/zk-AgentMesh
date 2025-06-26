import { NextRequest, NextResponse } from 'next/server';
import { PinataIPFSStorage } from '@zk-agentmesh/ipfs-storage';

const ipfsStorage = new PinataIPFSStorage(
  process.env.PINATA_API_KEY!,
  process.env.PINATA_API_SECRET!
);

// GET /api/proofs/[hash]/chain - Get proof inheritance chain
export async function GET(
  request: NextRequest,
  { params }: { params: { hash: string } }
) {
  try {
    const proofChain = await ipfsStorage.getProofChain(params.hash);
    
    return NextResponse.json({
      success: true,
      data: proofChain,
      chainLength: proofChain.length,
    });
  } catch (error) {
    console.error('Error getting proof chain:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get proof chain' },
      { status: 500 }
    );
  }
}