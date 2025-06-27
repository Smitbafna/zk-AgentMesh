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
