import { NextRequest, NextResponse } from 'next/server';
import { PinataIPFSStorage } from '@zk-agentmesh/ipfs-storage';

const ipfsStorage = new PinataIPFSStorage(
  process.env.PINATA_API_KEY!,
  process.env.PINATA_API_SECRET!
);

// POST /api/proofs/[hash]/verify - Verify proof integrity
export async function POST(
  request: NextRequest,
  { params }: { params: { hash: string } }
) {
  try {
    const isValid = await ipfsStorage.verifyProofIntegrity(params.hash);
    
    return NextResponse.json({
      success: true,
      data: {
        proofHash: params.hash,
        isValid,
        verifiedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error verifying proof:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify proof' },
      { status: 500 }
    );
  }
}
