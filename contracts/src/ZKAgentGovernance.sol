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