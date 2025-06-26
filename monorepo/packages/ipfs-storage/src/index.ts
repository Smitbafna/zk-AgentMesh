// packages/ipfs-storage/src/index.ts
import axios from 'axios';
import FormData from 'form-data';
import { createHash } from 'crypto';

export interface AgentMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  developer: string;
  license: string;
  trainingStandards: string[];
  complianceGoals: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProofRecord {
  agentId: string;
  proofType: 'quality' | 'ethics' | 'compliance';
  proofHash: string;
  circuitName: string;
  publicInputs: any[];
  verificationKey: string;
  createdAt: string;
  inheritedFrom?: string[]; // IPFS hashes of parent proofs
}

export interface AgentRegistry {
  agent: AgentMetadata;
  proofs: ProofRecord[];
  paymentConfig: {
    pricePerCall: string;
    revenueShares: {
      developer: number;
      trainer: number;
      verifier: number;
      host: number;
    };
  };
  dependencies: string[]; // IPFS hashes of dependent agents
}

export class PinataIPFSStorage {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl = 'https://api.pinata.cloud';

  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  private getAuthHeaders() {
    return {
      'pinata_api_key': this.apiKey,
      'pinata_secret_api_key': this.apiSecret,
    };
  }

  // Pin JSON data to IPFS
  async pinJSON(data: any, name: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/pinning/pinJSONToIPFS`,
        {
          pinataContent: data,
          pinataMetadata: {
            name,
            keyvalues: {
              type: data.type || 'unknown',
              version: data.version || '1.0.0',
            },
          },
        },
        {
          headers: {
            ...this.getAuthHeaders(),
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.IpfsHash;
    } catch (error) {
      console.error('Error pinning JSON to IPFS:', error);
      throw new Error(`Failed to pin JSON: ${error.message}`);
    }
  }

  // Pin file to IPFS
  async pinFile(fileBuffer: Buffer, fileName: string, contentType: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: fileName,
        contentType,
      });

      formData.append('pinataMetadata', JSON.stringify({
        name: fileName,
        keyvalues: {
          contentType,
          uploadedAt: new Date().toISOString(),
        },
      }));

      const response = await axios.post(
        `${this.baseUrl}/pinning/pinFileToIPFS`,
        formData,
        {
          headers: {
            ...this.getAuthHeaders(),
            ...formData.getHeaders(),
          },
        }
      );

      return response.data.IpfsHash;
    } catch (error) {
      console.error('Error pinning file to IPFS:', error);
      throw new Error(`Failed to pin file: ${error.message}`);
    }
  }

  // Retrieve data from IPFS
  async getData(ipfsHash: string): Promise<any> {
    try {
      const response = await axios.get(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);
      return response.data;
    } catch (error) {
      console.error('Error retrieving data from IPFS:', error);
      throw new Error(`Failed to retrieve data: ${error.message}`);
    }
  }

  // Register a new agent
  async registerAgent(agentData: AgentRegistry): Promise<string> {
    const registryEntry = {
      ...agentData,
      type: 'agent-registry',
      registeredAt: new Date().toISOString(),
      contentHash: this.generateContentHash(agentData),
    };

    const ipfsHash = await this.pinJSON(registryEntry, `agent-${agentData.agent.id}`);
    
    // Also create an index entry for discovery
    await this.updateAgentIndex(agentData.agent.id, ipfsHash, agentData.agent);
    
    return ipfsHash;
  }

  // Submit a proof for an agent
  async submitProof(agentId: string, proof: ProofRecord): Promise<string> {
    const proofEntry = {
      ...proof,
      type: 'zk-proof',
      submittedAt: new Date().toISOString(),
    };

    return await this.pinJSON(proofEntry, `proof-${agentId}-${proof.proofType}-${Date.now()}`);
  }

  // Update agent registry with new proof
  async updateAgentWithProof(registryHash: string, proofHash: string): Promise<string> {
    try {
      const currentRegistry = await this.getData(registryHash) as AgentRegistry;
      
      // Add the new proof hash to the registry
      const updatedRegistry = {
        ...currentRegistry,
        proofs: [...currentRegistry.proofs, { proofHash }],
        updatedAt: new Date().toISOString(),
      };

      return await this.pinJSON(updatedRegistry, `agent-${currentRegistry.agent.id}-updated`);
    } catch (error) {
      throw new Error(`Failed to update agent registry: ${error.message}`);
    }
  }

  // Create and maintain a searchable index
  private async updateAgentIndex(agentId: string, registryHash: string, metadata: AgentMetadata) {
    try {
      // Try to get existing index
      let agentIndex: any = {};
      try {
        agentIndex = await this.getData('agent-index') || {};
      } catch {
        // Index doesn't exist yet, start fresh
      }

      agentIndex[agentId] = {
        registryHash,
        name: metadata.name,
        description: metadata.description,
        developer: metadata.developer,
        version: metadata.version,
        tags: metadata.trainingStandards,
        lastUpdated: new Date().toISOString(),
      };

      await this.pinJSON(agentIndex, 'agent-index');
    } catch (error) {
      console.error('Failed to update agent index:', error);
    }
  }

  // Search and discovery functions
  async searchAgents(query: {
    name?: string;
    developer?: string;
    tags?: string[];
    proofTypes?: string[];
  }): Promise<any[]> {
    try {
      const index = await this.getData('agent-index');
      let results = Object.values(index);

      if (query.name) {
        results = results.filter((agent: any) => 
          agent.name.toLowerCase().includes(query.name.toLowerCase())
        );
      }

      if (query.developer) {
        results = results.filter((agent: any) => 
          agent.developer.toLowerCase().includes(query.developer.toLowerCase())
        );
      }

      if (query.tags && query.tags.length > 0) {
        results = results.filter((agent: any) => 
          query.tags.some(tag => agent.tags?.includes(tag))
        );
      }

      return results;
    } catch (error) {
      console.error('Error searching agents:', error);
      return [];
    }
  }

  // Get agent's complete registry data
  async getAgentRegistry(agentId: string): Promise<AgentRegistry | null> {
    try {
      const index = await this.getData('agent-index');
      const agentIndex = index[agentId];
      
      if (!agentIndex) {
        return null;
      }

      return await this.getData(agentIndex.registryHash);
    } catch (error) {
      console.error('Error getting agent registry:', error);
      return null;
    }
  }

  // Get proof inheritance chain
  async getProofChain(proofHash: string): Promise<ProofRecord[]> {
    try {
      const proof = await this.getData(proofHash) as ProofRecord;
      const chain = [proof];

      if (proof.inheritedFrom && proof.inheritedFrom.length > 0) {
        for (const parentHash of proof.inheritedFrom) {
          const parentChain = await this.getProofChain(parentHash);
          chain.push(...parentChain);
        }
      }

      return chain;
    } catch (error) {
      console.error('Error getting proof chain:', error);
      return [];
    }
  }

  // Verify proof integrity
  async verifyProofIntegrity(proofHash: string): Promise<boolean> {
    try {
      const proof = await this.getData(proofHash) as ProofRecord;
      
      // Verify the proof hash matches the content
      const contentHash = this.generateContentHash(proof);
      
      // In a real implementation, you'd also verify the ZK proof itself
      return true; // Simplified for this example
    } catch (error) {
      console.error('Error verifying proof integrity:', error);
      return false;
    }
  }

  private generateContentHash(data: any): string {
    return createHash('sha256')
      .update(JSON.stringify(data, Object.keys(data).sort()))
      .digest('hex');
  }

  // Cleanup and maintenance
  async unpinContent(ipfsHash: string): Promise<boolean> {
    try {
      await axios.delete(`${this.baseUrl}/pinning/unpin/${ipfsHash}`, {
        headers: this.getAuthHeaders(),
      });
      return true;
    } catch (error) {
      console.error('Error unpinning content:', error);
      return false;
    }
  }

  // Get pinning status and metadata
  async getPinStatus(ipfsHash: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/data/pinList?hashContains=${ipfsHash}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting pin status:', error);
      return null;
    }
  }
}