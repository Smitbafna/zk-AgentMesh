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
// AGENT REPUTATION NFT CONTRACT
// =============================================================================

contract AgentReputationNFT is ERC721, Ownable {
    struct ReputationMetadata {
        bytes32 agentId;
        uint256 reputationScore;
        uint256 verificationCount;
        uint256 lastUpdated;
        string metadataURI;
    }
    
    mapping(uint256 => ReputationMetadata) public reputationData;
    mapping(bytes32 => uint256) public agentToTokenId;
    
    uint256 private _tokenIdCounter = 1;
    address public verificationContract;
    
    event ReputationNFTMinted(
        uint256 indexed tokenId,
        bytes32 indexed agentId,
        uint256 reputationScore
    );
    
    event ReputationUpdated(
        uint256 indexed tokenId,
        uint256 newReputationScore
    );
    
    constructor(address _verificationContract) ERC721("Agent Reputation", "AGREP") {
        verificationContract = _verificationContract;
    }
    
    modifier onlyVerificationContract() {
        require(msg.sender == verificationContract, "Only verification contract");
        _;
    }
    
    function mintReputationNFT(
        bytes32 agentId,
        address agentCreator,
        uint256 reputationScore,
        string memory metadataURI
    ) external onlyVerificationContract {
        require(agentToTokenId[agentId] == 0, "NFT already exists for agent");
        
        uint256 tokenId = _tokenIdCounter++;
        _mint(agentCreator, tokenId);
        
        reputationData[tokenId] = ReputationMetadata({
            agentId: agentId,
            reputationScore: reputationScore,
            verificationCount: 1,
            lastUpdated: block.timestamp,
            metadataURI: metadataURI
        });
        
        agentToTokenId[agentId] = tokenId;
        
        emit ReputationNFTMinted(tokenId, agentId, reputationScore);
    }
    
    function updateReputation(
        bytes32 agentId,
        uint256 newReputationScore
    ) external onlyVerificationContract {
        uint256 tokenId = agentToTokenId[agentId];
        require(tokenId != 0, "NFT does not exist");
        
        ReputationMetadata storage metadata = reputationData[tokenId];
        metadata.reputationScore = newReputationScore;
        metadata.verificationCount++;
        metadata.lastUpdated = block.timestamp;
        
        emit ReputationUpdated(tokenId, newReputationScore);
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        return reputationData[tokenId].metadataURI;
    }
    
    function setVerificationContract(address _verificationContract) external onlyOwner {
        verificationContract = _verificationContract;
    }
    
    // Prevent transfers to maintain reputation integrity
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        // Allow minting and burning, but restrict transfers
        require(from == address(0) || to == address(0), "Reputation NFTs are non-transferable");
    }
}

// =============================================================================
// QUERY PROCESSING AND PAYMENT CONTRACT
// =============================================================================

contract ZKQueryProcessor is ReentrancyGuard, Ownable {
    using ECDSA for bytes32;
    
    struct QueryRequest {
        bytes32 agentId;
        address requester;
        uint256 queryType;
        uint256 paymentAmount;
        uint256 timestamp;
        bool processed;
        bytes32 responseCommitment;
    }
    
    struct AgentCapabilities {
        mapping(uint256 => bool) supportedQueryTypes;
        uint256 basePrice;
        uint256 complexityMultiplier;
        bool acceptingQueries;
    }
    
    mapping(bytes32 => QueryRequest) public queries;
    mapping(bytes32 => AgentCapabilities) public agentCapabilities;
    mapping(address => uint256) public userBalances;
    
    ZKAgentVerificationCore public verificationContract;
    IERC20 public paymentToken;
    
    uint256 public platformFeePercent = 250; // 2.5%
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    event QuerySubmitted(
        bytes32 indexed queryId,
        bytes32 indexed agentId,
        address indexed requester,
        uint256 paymentAmount
    );
    
    event QueryProcessed(
        bytes32 indexed queryId,
        bytes32 responseCommitment,
        bytes32 proofHash
    );
    
    event CapabilitiesUpdated(
        bytes32 indexed agentId,
        uint256[] supportedTypes,
        uint256 basePrice
    );
    
    constructor(
        address _verificationContract,
        address _paymentToken
    ) {
        verificationContract = ZKAgentVerificationCore(_verificationContract);
        paymentToken = IERC20(_paymentToken);
    }
    
    // Agent sets their capabilities and pricing
    function setAgentCapabilities(
        bytes32 agentId,
        uint256[] memory supportedQueryTypes,
        uint256 basePrice,
        uint256 complexityMultiplier
    ) external {
        require(
            verificationContract.isAgentFullyVerified(agentId),
            "Agent not verified"
        );
        
        AgentCapabilities storage capabilities = agentCapabilities[agentId];
        
        // Clear existing capabilities
        for (uint256 i = 0; i < 100; i++) {
            capabilities.supportedQueryTypes[i] = false;
        }
        
        // Set new capabilities
        for (uint256 i = 0; i < supportedQueryTypes.length; i++) {
            capabilities.supportedQueryTypes[supportedQueryTypes[i]] = true;
        }
        
        capabilities.basePrice = basePrice;
        capabilities.complexityMultiplier = complexityMultiplier;
        capabilities.acceptingQueries = true;
        
        emit CapabilitiesUpdated(agentId, supportedQueryTypes, basePrice);
    }
    
    // User submits query to agent
    function submitQuery(
        bytes32 agentId,
        uint256 queryType,
        uint256 paymentAmount,
        bytes32 queryHash
    ) external nonReentrant {
        require(
            verificationContract.isAgentFullyVerified(agentId),
            "Agent not verified"
        );
        require(
            agentCapabilities[agentId].supportedQueryTypes[queryType],
            "Query type not supported"
        );
        require(
            agentCapabilities[agentId].acceptingQueries,
            "Agent not accepting queries"
        );
        
        // Calculate expected payment
        uint256 expectedPayment = calculateQueryPayment(agentId, queryType, 500); // Assuming medium complexity
        require(paymentAmount >= expectedPayment, "Insufficient payment");
        
        // Transfer payment from user
        require(
            paymentToken.transferFrom(msg.sender, address(this), paymentAmount),
            "Payment transfer failed"
        );
        
        bytes32 queryId = keccak256(abi.encodePacked(
            agentId,
            msg.sender,
            queryType,
            queryHash,
            block.timestamp
        ));
        
        queries[queryId] = QueryRequest({
            agentId: agentId,
            requester: msg.sender,
            queryType: queryType,
            paymentAmount: paymentAmount,
            timestamp: block.timestamp,
            processed: false,
            responseCommitment: bytes32(0)
        });
        
        emit QuerySubmitted(queryId, agentId, msg.sender, paymentAmount);
    }
    
    // Agent submits query processing proof
    function submitQueryProcessingProof(
        bytes32 queryId,
        ZKVerificationLib.Proof memory proof,
        uint256[] memory publicInputs
    ) external nonReentrant {
        QueryRequest storage query = queries[queryId];
        require(!query.processed, "Query already processed");
        require(query.requester != address(0), "Query does not exist");
        
        // Verify the processing proof
        bool isValid = ZKVerificationLib.verifyProof(
            verificationContract.verifyingKeys(
                ZKAgentVerificationCore.VerificationType.PRIVACY_QUERY_PROCESSING
            ),
            proof,
            publicInputs
        );
        
        require(isValid, "Invalid processing proof");
        
        // Extract response commitment from public inputs
        query.responseCommitment = bytes32(publicInputs[1]);
        query.processed = true;
        
        // Calculate payments
        uint256 platformFee = (query.paymentAmount * platformFeePercent) / FEE_DENOMINATOR;
        uint256 agentPayment = query.paymentAmount - platformFee;
        
        // Get agent creator address
        (address agentCreator,,,,,) = verificationContract.agents(query.agentId);
        
        // Transfer payments
        require(paymentToken.transfer(agentCreator, agentPayment), "Agent payment failed");
        
        bytes32 proofHash = keccak256(abi.encodePacked(
            proof.a[0], proof.a[1],
            proof.b[0][0], proof.b[0][1], proof.b[1][0], proof.b[1][1],
            proof.c[0], proof.c[1]
        ));
        
        emit QueryProcessed(queryId, query.responseCommitment, proofHash);
    }
    
    // Calculate expected payment for a query
    function calculateQueryPayment(
        bytes32 agentId,
        uint256 queryType,
        uint256 estimatedComplexity
    ) public view returns (uint256) {
        AgentCapabilities storage capabilities = agentCapabilities[agentId];
        
        uint256 basePayment = capabilities.basePrice;
        uint256 complexityAdjustment = (estimatedComplexity * capabilities.complexityMultiplier) / 1000;
        
        return basePayment + complexityAdjustment;
    }
    
    // Admin functions
    function setPlatformFee(uint256 _platformFeePercent) external onlyOwner {
        require(_platformFeePercent <= 1000, "Fee too high"); // Max 10%
        platformFeePercent = _platformFeePercent;
    }
    
    function withdrawPlatformFees() external onlyOwner {
        uint256 balance = paymentToken.balanceOf(address(this));
        require(paymentToken.transfer(owner(), balance), "Withdrawal failed");
    }
    
    // View functions
    function getQueryDetails(bytes32 queryId) external view returns (QueryRequest memory) {
        return queries[queryId];
    }
    
    function isQueryTypeSupported(bytes32 agentId, uint256 queryType) 
        external view returns (bool) {
        return agentCapabilities[agentId].supportedQueryTypes[queryType];
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