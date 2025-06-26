# ZK-AgentMesh: Marketplace for Monetized AI Agents

Please visit our [documentation](https://smits-organization-1.gitbook.io/zk-agentmesh) for more details 



# Complete Infrastructure Setup - Decentralized Agent Platform

## **Turborepo Structure**

### **Apps**
- **`agent-runtime`** - Core agent execution environment with ZK proof generation
- **`registry-api`** - Agent discovery and verification API service  
- **`web`** - User interface for agent interaction and management

### **Packages**
- **`circuits`** - Zero-knowledge proof circuits for quality and compliance
- **`payment-layer`** - Micropayment infrastructure with revenue splitting
- **`contracts`** - Smart contracts for agent registry and proof inheritance
- **`ipfs-storage`** - IPFS storage 

### **Optimized Build Pipeline**
- Dependency caching across all packages and apps
- Parallel builds with smart dependency resolution
- Hot reload development environment
- Production-optimized Docker builds

## **Akash Network Integration**

### **Production-Ready Manifests**
- Individual service manifests for each component
- Auto-scaling configurations based on demand
- Resource limits and requests optimization
- Health checks and readiness probes

### **Docker Containers**
- Multi-stage builds for minimal image sizes
- Security scanning and vulnerability patches
- Optimized for decentralized compute environments
- Persistent volume configurations

### **SGX Support**
- Trusted execution environment setup
- Secure key management and attestation
- Privacy-preserving agent execution
- Hardware-based security guarantees

### **Resource Allocation**
- Cost-optimized compute configurations
- Dynamic scaling based on usage patterns
- Network bandwidth optimization
- Storage allocation strategies

## **IPFS & Pinata Integration**

### **Decentralized Storage Architecture**
- **Agent Metadata**: Stored on IPFS with Pinata pinning service
- **ZK Proofs**: Distributed storage for proof artifacts and circuits  
- **Proof Inheritance**: IPFS-based linking for composable proof chains
- **Content Addressing**: Immutable references via IPFS hashes

### **Pinata Configuration**
```typescript
// IPFS client setup with Pinata
const pinataConfig = {
  pinataApiKey: process.env.PINATA_API_KEY,
  pinataSecretApiKey: process.env.PINATA_SECRET_KEY,
  pinataJWT: process.env.PINATA_JWT
}

// Agent registration on IPFS
const agentMetadata = {
  id: agentId,
  name: "AI Agent",
  proofHash: zkProofHash,
  inheritanceChain: [parentProofHash1, parentProofHash2],
  verificationLevel: 3,
  creator: creatorAddress
}

const ipfsHash = await pinata.pinJSONToIPFS(agentMetadata)
```

## **Key Components Built**

### **1. Agent Runtime Server** (`apps/agent-runtime/`)


**Features:**
- Express.js server with TypeScript
- ZK proof generation pipeline
- Payment verification via x402pay
- Revenue splitting with CDP Wallet
- SGX-enabled secure execution environment
- Real-time agent monitoring and logging

### **2. Registry API** (`apps/registry-api/`)


**Features:**
- Next.js API for agent discovery
- IPFS with Pinata for decentralized storage
- On-chain verification integration
- Composable proof inheritance tracking
- Agent reputation and quality scoring
- Distributed search and indexing capabilities

### **3. ZK Proof Engine** (`packages/circuits/`)

**Features:**
- Quality, ethics, and compliance circuits
- Groth16 proof generation with snarkjs
- Privacy-preserving verification system
- Composable proof inheritance
- Batch verification optimization
- Circuit parameter generation

### **4. Payment Layer** (`packages/payment-layer/`)


**Features:**
- x402pay micropayment integration
- CDP Wallet programmable revenue splits
- Automated gas estimation and optimization
- Multi-token payment support
- Escrow and dispute resolution
- Real-time payment tracking

### **5. Smart Contracts** (`packages/contracts/`)


**Features:**
- Agent registry with proof inheritance
- Royalty system for proof creators
- Verification level tracking
- Composable agent architecture
- On-chain governance mechanisms
- Upgrade-safe contract design

## **x402pay Integration with CDP & Amazon Nova**

### **Micropayment Infrastructure**
The x402pay integration provides seamless micropayments for agent services without requiring user accounts or traditional payment processing.

**Core Components:**
- **Payment Channels**: Lightning Network-style channels for instant payments
- **Revenue Splitting**: Automated distribution via CDP Wallet programmable splits
- **Gas Optimization**: Amazon Nova's compute pricing integrated with payment flow

### **CDP Wallet Integration**
```typescript
// Revenue splitting configuration
const revenueConfig = {
  agentCreator: 40,     // 40% to agent creator
  proofProvider: 30,    // 30% to proof inheritance chain
  platform: 20,        // 20% to platform maintenance
  validators: 10        // 10% to proof validators
}

// Automated split execution
await cdpWallet.executeSplit({
  amount: paymentAmount,
  recipients: calculateRecipients(revenueConfig),
  trigger: 'proof_verification_complete'
})
```

### **Amazon Nova Compute Integration**
- **Cost-Aware Scheduling**: Dynamic pricing based on Nova's compute costs
- **Payment Routing**: Direct integration between x402pay and Nova billing
- **Resource Optimization**: Automatic scaling based on payment volume
- **Privacy Preservation**: SGX attestation for sensitive computations

**Payment Flow:**
1. User initiates agent request with x402pay micropayment
2. Payment is held in escrow during execution
3. Agent runs in Nova SGX environment with cost tracking
4. Upon completion, payment is released and split via CDP Wallet
5. Proof inheritance creators receive royalties automatically

### **Implementation Details**
```javascript
// x402pay payment initialization
const paymentChannel = await x402pay.createChannel({
  amount: estimatedCost,
  recipient: agentWallet,
  metadata: {
    agentId: selectedAgent.id,
    executionType: 'sgx_verified',
    inheritanceChain: proofInheritanceIds
  }
})

// Nova compute reservation
const computeReservation = await nova.reserveCompute({
  type: 'sgx_enabled',
  duration: estimatedRuntime,
  paymentChannel: paymentChannel.id
})
```

This integration ensures that agent creators are fairly compensated, proof inheritance is economically incentivized, and the entire system operates without traditional payment friction while maintaining privacy and security through SGX and zero-knowledge proofs.

## **Deployment Architecture**

### **IPFS Integration Example**
```typescript
// Store agent data on IPFS
const storeAgentOnIPFS = async (agentData) => {
  const metadata = {
    ...agentData,
    timestamp: Date.now(),
    ipfsVersion: "1.0"
  }
  
  const result = await pinata.pinJSONToIPFS(metadata, {
    pinataMetadata: {
      name: `agent-${agentData.id}`,
      keyvalues: {
        type: 'agent_registry',
        verification_level: agentData.verificationLevel
      }
    }
  })
  
  return result.IpfsHash
}

// Retrieve agent data from IPFS
const getAgentFromIPFS = async (ipfsHash) => {
  const response = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`)
  return response.json()
}

// Update smart contract with IPFS reference
const registerAgent = async (agentId, ipfsHash) => {
  await agentRegistry.registerAgent(agentId, ipfsHash, {
    gasLimit: 500000
  })
}
```

This IPFS integration ensures that agent data is stored in a decentralized manner while maintaining fast access through Pinata's pinning service. The smart contracts only store IPFS hashes, keeping on-chain storage costs minimal while preserving immutability and censorship resistance.

- **Agents can inherit proofs** from each other while maintaining privacy through zero-knowledge verification
- **Payment layer handles microtransactions** seamlessly without requiring user accounts
- **SGX ensures secure execution** in untrusted environments
- **Akash Network provides** decentralized compute infrastructure
- **CDP Wallet enables** programmable revenue distribution
- **Amazon Nova integration** optimizes compute costs and performance

Each component can be deployed independently on Akash Network, creating a resilient and scalable decentralized agent platform that incentivizes quality through economic mechanisms and cryptographic proofs.