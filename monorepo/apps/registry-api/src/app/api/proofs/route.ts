// apps/registry-api/src/app/api/proofs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PinataIPFSStorage } from '@zk-agentmesh/ipfs-storage';

const ipfsStorage = new PinataIPFSStorage(
  process.env.PINATA_API_KEY!,
  process.env.PINATA_API_SECRET!
);

// POST /api/proofs - Submit a new proof
export async function POST(request: NextRequest) {
  try {
    const proofData = await request.json();
    
    // Validate required fields
    if (!proofData.agentId || !proofData.proofType || !proofData.proofHash) {
      return NextResponse.json(
        { success: false, error: 'Agent ID, proof type, and proof hash are required' },
        { status: 400 }
      );
    }

    const proofHash = await ipfsStorage.submitProof(proofData.agentId, proofData);
    
    return NextResponse.json({
      success: true,
      data: {
        proofHash,
        ipfsUrl: `https://gateway.pinata.cloud/ipfs/${proofHash}`,
      },
    });
  } catch (error) {
    console.error('Error submitting proof:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit proof' },
      { status: 500 }
    );
  }
}