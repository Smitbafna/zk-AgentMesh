// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";



// =============================================================================
// AGENT VERIFICATION CORE CONTRACT
// =============================================================================

contract ZKAgentVerificationCore is Ownable, ReentrancyGuard {
    using ZKVerificationLib for ZKVerificationLib.VerifyingKey;
    
    struct Agent {
        address creator;
        string metadataURI;
        uint256 registrationTime;
        bool isActive;
        uint256 totalVerifications;
        uint256 lastVerificationTime;
        mapping(bytes32 => bool) verificationProofs;
    }
    
    struct VerificationResult {
        bool qualityVerified;
        bool ethicsVerified;
        bool complianceVerified;
        bool capabilityVerified;
        uint256 reputationScore;
        uint256 timestamp;
        bytes32 masterProofHash;
    }
    
    // Verification types
    enum VerificationType {
        TRAINING_QUALITY,
        ETHICS_COMPLIANCE,
        REGULATORY_COMPLIANCE,
        CAPABILITY_VERIFICATION,
        REPUTATION_SCORING,
        INCENTIVE_ALIGNMENT,
        DYNAMIC_ADAPTATION,
        PRIVACY_QUERY_PROCESSING
    }
    
    // State variables
    mapping(bytes32 => Agent) public agents;
    mapping(bytes32 => VerificationResult) public verificationResults;
    mapping(VerificationType => ZKVerificationLib.VerifyingKey) public verifyingKeys;
    
    bytes32[] public registeredAgents;
    uint256 public totalRegisteredAgents;
    uint256 public verificationFee = 0.01 ether;
    uint256 public registrationFee = 0.005 ether;
    
    // Events
    event AgentRegistered(
        bytes32 indexed agentId,
        address indexed creator,
        string metadataURI
    );
    
    event VerificationSubmitted(
        bytes32 indexed agentId,
        VerificationType verificationType,
        bool verified,
        bytes32 proofHash
    );
    
    event AgentFullyVerified(
        bytes32 indexed agentId,
        uint256 reputationScore,
        bytes32 masterProofHash
    );
    
    // Modifiers
    modifier onlyAgentCreator(bytes32 agentId) {
        require(agents[agentId].creator == msg.sender, "Not agent creator");
        _;
    }
    
    modifier agentExists(bytes32 agentId) {
        require(agents[agentId].creator != address(0), "Agent does not exist");
        _;
    }
    
    // Constructor
    constructor() {}
    
    // Register new agent
    function registerAgent(
        bytes32 agentId,
        string memory metadataURI
    ) external payable {
        require(msg.value >= registrationFee, "Insufficient registration fee");
        require(agents[agentId].creator == address(0), "Agent already registered");
        
        Agent storage agent = agents[agentId];
        agent.creator = msg.sender;
        agent.metadataURI = metadataURI;
        agent.registrationTime = block.timestamp;
        agent.isActive = true;
        
        registeredAgents.push(agentId);
        totalRegisteredAgents++;
        
        emit AgentRegistered(agentId, msg.sender, metadataURI);
    }
    
    // Submit verification proof
    function submitVerificationProof(
        bytes32 agentId,
        VerificationType verificationType,
        ZKVerificationLib.Proof memory proof,
        uint256[] memory publicInputs
    ) external payable agentExists(agentId) onlyAgentCreator(agentId) {
        require(msg.value >= verificationFee, "Insufficient verification fee");
        
        // Verify the ZK proof
        bool isValid = ZKVerificationLib.verifyProof(
            verifyingKeys[verificationType],
            proof,
            publicInputs
        );
        
        require(isValid, "Invalid proof");
        
        // Store proof hash
        bytes32 proofHash = keccak256(abi.encodePacked(
            proof.a[0], proof.a[1],
            proof.b[0][0], proof.b[0][1], proof.b[1][0], proof.b[1][1],
            proof.c[0], proof.c[1]
        ));
        
        agents[agentId].verificationProofs[proofHash] = true;
        agents[agentId].totalVerifications++;
        agents[agentId].lastVerificationTime = block.timestamp;
        
        // Update verification results based on type
        VerificationResult storage result = verificationResults[agentId];
        
        if (verificationType == VerificationType.TRAINING_QUALITY) {
            result.qualityVerified = true;
        } else if (verificationType == VerificationType.ETHICS_COMPLIANCE) {
            result.ethicsVerified = true;
        } else if (verificationType == VerificationType.REGULATORY_COMPLIANCE) {
            result.complianceVerified = true;
        } else if (verificationType == VerificationType.CAPABILITY_VERIFICATION) {
            result.capabilityVerified = true;
        }
        
        result.timestamp = block.timestamp;
        
        emit VerificationSubmitted(agentId, verificationType, true, proofHash);
        
        // Check if agent is fully verified
        if (result.qualityVerified && result.ethicsVerified && 
            result.complianceVerified && result.capabilityVerified) {
            _updateFullVerificationStatus(agentId, publicInputs);
        }
    }
    
    // Internal function to handle full verification
    function _updateFullVerificationStatus(
        bytes32 agentId,
        uint256[] memory publicInputs
    ) internal {
        VerificationResult storage result = verificationResults[agentId];
        
        // Extract reputation score from public inputs (assuming it's at index 4)
        if (publicInputs.length > 4) {
            result.reputationScore = publicInputs[4];
        }
        
        // Generate master proof hash
        result.masterProofHash = keccak256(abi.encodePacked(
            agentId,
            result.qualityVerified,
            result.ethicsVerified,
            result.complianceVerified,
            result.capabilityVerified,
            result.reputationScore,
            block.timestamp
        ));
        
        emit AgentFullyVerified(agentId, result.reputationScore, result.masterProofHash);
    }
    
    // Admin functions
    function setVerifyingKey(
        VerificationType verificationType,
        ZKVerificationLib.VerifyingKey memory vk
    ) external onlyOwner {
        verifyingKeys[verificationType] = vk;
    }
    
    function setFees(uint256 _registrationFee, uint256 _verificationFee) external onlyOwner {
        registrationFee = _registrationFee;
        verificationFee = _verificationFee;
    }
    
    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    // View functions
    function getAgentVerificationStatus(bytes32 agentId) 
        external view returns (VerificationResult memory) {
        return verificationResults[agentId];
    }
    
    function isAgentFullyVerified(bytes32 agentId) external view returns (bool) {
        VerificationResult memory result = verificationResults[agentId];
        return result.qualityVerified && result.ethicsVerified && 
               result.complianceVerified && result.capabilityVerified;
    }
    
    function getRegisteredAgents() external view returns (bytes32[] memory) {
        return registeredAgents;
    }
}




// =============================================================================
// GOVERNANCE AND DISPUTE RESOLUTION CONTRACT
// =============================================================================

contract ZKAgentGovernance is Ownable {
    struct Proposal {
        uint256 id;
        address proposer;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        uint256 startTime;
        uint256 endTime;
        bool executed;
        mapping(address => bool) hasVoted;
        mapping(address => uint256) voteChoice; // 0=against, 1=for, 2=abstain
    }
    
    struct Dispute {
        uint256 id;
        bytes32 agentId;
        address complainant;
        string description;
        uint256 deposit;
        bool resolved;
        bool upheld;
        uint256 createdAt;
    }
    
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => Dispute) public disputes;
    mapping(address => uint256) public votingPower;
    
    uint256 public nextProposalId = 1;
    uint256 public nextDisputeId = 1;
    uint256 public votingPeriod = 7 days;
    uint256 public minimumQuorum = 1000; // Minimum voting power needed
    uint256 public disputeDeposit = 100 * 10**18; // 100 tokens
    
    ZKAgentVerificationCore public verificationContract;
    AgentReputationNFT public reputationNFT;
    IERC20 public governanceToken;
    
    event ProposalCreated(uint256 indexed proposalId, address indexed proposer);
    event VoteCast(uint256 indexed proposalId, address indexed voter, uint256 choice);
    event ProposalExecuted(uint256 indexed proposalId, bool passed);
    event DisputeCreated(uint256 indexed disputeId, bytes32 indexed agentId);
    event DisputeResolved(uint256 indexed disputeId, bool upheld);
    
    constructor(
        address _verificationContract,
        address _reputationNFT,
        address _governanceToken
    ) {
        verificationContract = ZKAgentVerificationCore(_verificationContract);
        reputationNFT = AgentReputationNFT(_reputationNFT);
        governanceToken = IERC20(_governanceToken);
    }
    
    // Create governance proposal
    function createProposal(string memory description) external {
        require(governanceToken.balanceOf(msg.sender) >= 100 * 10**18, "Insufficient tokens");
        
        uint256 proposalId = nextProposalId++;
        Proposal storage proposal = proposals[proposalId];
        
        proposal.id = proposalId;
        proposal.proposer = msg.sender;
        proposal.description = description;
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + votingPeriod;
        
        emit ProposalCreated(proposalId, msg.sender);
    }
    
    // Vote on proposal
    function vote(uint256 proposalId, uint256 choice) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.startTime, "Voting not started");
        require(block.timestamp <= proposal.endTime, "Voting ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        require(choice <= 2, "Invalid choice");
        
        uint256 power = governanceToken.balanceOf(msg.sender);
        require(power > 0, "No voting power");
        
        proposal.hasVoted[msg.sender] = true;
        proposal.voteChoice[msg.sender] = choice;
        
        if (choice == 0) {
            proposal.againstVotes += power;
        } else if (choice == 1) {
            proposal.forVotes += power;
        } else {
            proposal.abstainVotes += power;
        }
        
        emit VoteCast(proposalId, msg.sender, choice);
    }
    
    // Execute proposal
    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp > proposal.endTime, "Voting still active");
        require(!proposal.executed, "Already executed");
        
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        require(totalVotes >= minimumQuorum, "Insufficient quorum");
        
        bool passed = proposal.forVotes > proposal.againstVotes;
        proposal.executed = true;
        
        emit ProposalExecuted(proposalId, passed);
    }
    
    // Create dispute against agent
    function createDispute(
        bytes32 agentId,
        string memory description
    ) external {
        require(
            governanceToken.transferFrom(msg.sender, address(this), disputeDeposit),
            "Deposit transfer failed"
        );
        
        uint256 disputeId = nextDisputeId++;
        disputes[disputeId] = Dispute({
            id: disputeId,
            agentId: agentId,
            complainant: msg.sender,
            description: description,
            deposit: disputeDeposit,
            resolved: false,
            upheld: false,
            createdAt: block.timestamp
        });
        
        emit DisputeCreated(disputeId, agentId);
    }
    
    // Resolve dispute (admin function for now)
    function resolveDispute(uint256 disputeId, bool upheld) external onlyOwner {
        Dispute storage dispute = disputes[disputeId];
        require(!dispute.resolved, "Already resolved");
        
        dispute.resolved = true;
        dispute.upheld = upheld;
        
        if (upheld) {
            // Return deposit to complainant
            require(
                governanceToken.transfer(dispute.complainant, dispute.deposit),
                "Deposit return failed"
            );
            
            // TODO: Implement penalty for agent (reduce reputation, etc.)
        } else {
            // Keep deposit as penalty for false complaint
        }
        
        emit DisputeResolved(disputeId, upheld);
    }
    
    // Admin functions
    function setVotingPeriod(uint256 _votingPeriod) external onlyOwner {
        votingPeriod = _votingPeriod;
    }
    
    function setMinimumQuorum(uint256 _minimumQuorum) external onlyOwner {
        minimumQuorum = _minimumQuorum;
    }
    
    function setDisputeDeposit(uint256 _disputeDeposit) external onlyOwner {
        disputeDeposit = _disputeDeposit;
    }
}