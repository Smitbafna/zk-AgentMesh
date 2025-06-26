// =============================================================================
// PRIVACY-PRESERVING QUERY PROCESSING CIRCUIT
// =============================================================================


pragma circom 2.0.0;


/**
 * @title QueryProcessor
 * @dev Processes queries while preserving privacy of both query and response
 */
template QueryProcessor(max_query_length, max_response_length) {
    //  inputs
    signal  input query_hash;              // Hash of original query
    signal  input response_hash;           // Hash of generated response  
    signal  input processing_metadata[8];  // Processing metadata (timing, resources, etc.)
    signal  input model_state_hash;        // Hash of model state during processing
    signal  input query_classification;    // Internal query classification
    
    // Public inputs
    signal input agent_id;                        // Agent processing the query
    signal input requester_address;              // Address of query requester
    signal input query_type;                     // Public query type classification
    signal input payment_amount;                 // Payment for the query
    signal input timestamp;                      // Query timestamp
    
    // Public outputs  
    signal output processing_verified;           // 1 if processing was legitimate
    signal output response_commitment;           // Commitment to response (for later reveal)
    signal output processing_proof_hash;         // Unique processing proof
    signal output query_complexity_score;       // Computed complexity score
    
    // Components
    component complexity_calculator = QueryComplexityCalculator(8);
    component processing_hasher = Poseidon(7);
    component response_commitment_hasher = Poseidon(4);
    component legitimacy_checker = ProcessingLegitimacyChecker();
    
    // Calculate query complexity based on metadata
    for (var i = 0; i < 8; i++) {
        complexity_calculator.metadata[i] <== processing_metadata[i];
    }
    query_complexity_score <== complexity_calculator.complexity;
    
    // Verify processing legitimacy
    legitimacy_checker.agent_id <== agent_id;
    legitimacy_checker.query_type <== query_type;
    legitimacy_checker.complexity <== query_complexity_score;
    legitimacy_checker.payment <== payment_amount;
    processing_verified <== legitimacy_checker.legitimate;
    
    // Generate response commitment (for privacy-preserving reveal)
    response_commitment_hasher.inputs[0] <== response_hash;
    response_commitment_hasher.inputs[1] <== agent_id;
    response_commitment_hasher.inputs[2] <== requester_address;
    response_commitment_hasher.inputs[3] <== timestamp;
    response_commitment <== response_commitment_hasher.out;
    
    // Generate processing proof hash
    processing_hasher.inputs[0] <== agent_id;
    processing_hasher.inputs[1] <== query_hash;
    processing_hasher.inputs[2] <== response_commitment;
    processing_hasher.inputs[3] <== query_complexity_score;
    processing_hasher.inputs[4] <== requester_address;
    processing_hasher.inputs[5] <== payment_amount;
    processing_hasher.inputs[6] <== timestamp;
    processing_proof_hash <== processing_hasher.out;
}

/**
 * @title QueryComplexityCalculator
 * @dev Calculates query complexity from processing metadata
 */
template QueryComplexityCalculator(n_metadata) {
    signal input metadata[n_metadata];
    signal output complexity;
    
    // Weighted complexity calculation
    signal weighted_sum;
    weighted_sum <== metadata[0] * 10 +      // Processing time weight
                     metadata[1] * 5 +       // Memory usage weight  
                     metadata[2] * 3 +       // Token count weight
                     metadata[3] * 8 +       // Model inference cost weight
                     metadata[4] * 2 +       // I/O operations weight
                     metadata[5] * 4 +       // Context length weight
                     metadata[6] * 6 +       // Reasoning depth weight
                     metadata[7] * 1;        // Additional resources weight
    
    // Normalize to 0-1000 scale
    complexity <== weighted_sum \ 39; // Divide by sum of weights
}

/**
 * @title ProcessingLegitimacyChecker  
 * @dev Verifies query processing was legitimate and correctly priced
 */
template ProcessingLegitimacyChecker() {
    signal input agent_id;
    signal input query_type;
    signal input complexity;
    signal input payment;
    signal output legitimate;
    
    // Check if payment matches complexity (simplified pricing model)
    component payment_check = PaymentValidityChecker();
    payment_check.complexity <== complexity;
    payment_check.payment <== payment;
    payment_check.query_type <== query_type;
    
    // For now, just check payment validity
    legitimate <== payment_check.valid;
}

/**
 * @title PaymentValidityChecker
 * @dev Validates payment amount matches query complexity
 */
template PaymentValidityChecker() {
    signal input complexity;
    signal input payment;
    signal input query_type;
    signal output valid;
    
    // Calculate expected payment based on complexity
    signal base_price;
    base_price <== 10; // Base price in payment units
    
    signal complexity_multiplier;
    complexity_multiplier <== 1 + (complexity * 2) \ 1000; // 1x to 3x based on complexity
    
    signal expected_payment;
    expected_payment <== base_price * complexity_multiplier;
    
    // Allow 10% tolerance in payment
    signal min_payment;
    signal max_payment;
    min_payment <== (expected_payment * 90) \ 100;
    max_payment <== (expected_payment * 110) \ 100;
    
    component min_check = GreaterEqThan(16);
    component max_check = LessEqThan(16);
    
    min_check.in[0] <== payment;
    min_check.in[1] <== min_payment;
    
    max_check.in[0] <== payment;
    max_check.in[1] <== max_payment;
    
    valid <== min_check.out * max_check.out;
}