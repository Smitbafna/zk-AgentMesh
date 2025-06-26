import { NextRequest, NextResponse } from 'next/server';
import { PinataIPFSStorage } from '@zk-agentmesh/ipfs-storage';

const ipfsStorage = new PinataIPFSStorage(
  process.env.PINATA_API_KEY!,
  process.env.PINATA_API_SECRET!
);

// GET /api/proofs/[hash] - Get proof details
export async function GET(
  request: NextRequest,
  { params }: { params: { hash: string } }
) {
  try {
    const proofData = await ipfsStorage.getData(params.hash);
    
    return NextResponse.json({
      success: true,
      data: proofData,
    });
  } catch (error) {
    console.error('Error getting proof:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get proof' },
      { status: 500 }
    );
  }
}
