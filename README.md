# ZK-AgentMesh: Marketplace for Monetized AI Agents

Please visit our [documentation](https://smits-organization-1.gitbook.io/zk-agentmesh) for more details 



## **Complete Infrastructure Setup**

### **Turborepo Structure**
- **Apps**: `agent-runtime`, `registry-api`, `frontend`
- **Packages**: `circuits`, `payment-layer`, `contracts`
- **Optimized build pipeline** with dependency caching

### **Akash Network Integration**
- **Production-ready manifests** for each service
- **Docker containers** optimized for decentralized compute
- **SGX support** for trusted execution environments
- **Resource allocation** configs for cost optimization

### **Key Components Built**

1. **Agent Runtime Server** (`apps/agent-runtime/`)
   - Express.js server with ZK proof generation  
   - Payment verification via x402pay
   - Revenue splitting with CDP Wallet
   - SGX-enabled secure execution

2. **Registry API** (`apps/registry-api/`)
   - Next.js API for agent discovery
   - PostgreSQL database with Prisma ORM
   - On-chain verification integration
   - Composable proof inheritance tracking

3. **ZK Proof Engine** (`packages/circuits/`)
   - Quality, ethics, and compliance circuits
   - Groth16 proof generation with snarkjs
   - Privacy-preserving verification system

4. **Payment Layer** (`packages/payment-layer/`)
   - x402pay micropayment integration
   - CDP Wallet programmable revenue splits
   - Automated gas estimation

5. **Smart Contracts** (`packages/contracts/`)
   - Agent registry with proof inheritance
   - Royalty system for proof creators
   - Verification level tracking



The system is designed to be **fully decentralized** and **composable** agents can inherit proofs from each other while maintaining privacy through zero-knowledge verification. The payment layer handles microtransactions seamlessly without requiring user accounts.

