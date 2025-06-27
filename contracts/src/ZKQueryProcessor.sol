pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {ZKAgentVerificationCore} from "./ZKAgentVerificationCore.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ZKVerificationLib} from "./ZKVerificationLib.sol";

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