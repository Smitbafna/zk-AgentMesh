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



