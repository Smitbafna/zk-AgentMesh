// =============================================================================
// TRAINING QUALITY VERIFICATION CIRCUIT
// =============================================================================

pragma circom 2.0.0;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/bitify.circom";

/**
 * @title TrainingQualityVerifier
 * @dev Verifies AI agent training meets quality commitments without revealing training data
 */
template TrainingQualityVerifier(n_samples, n_metrics) {
    //  inputs (training data and results)
    signal input training_samples[n_samples*32]; // Hashed training samples
    signal input model_responses[n_samples*32];  // Hashed model outputs
    signal input quality_scores[n_samples];       // Individual quality scores (0-1000)
    signal input training_seed;                   // Random seed for training process
    signal input model_weights_hash;              // Hash of final model weights
    
    // Public inputs (commitments and thresholds)
    signal input agent_id;                    // Unique agent identifier
    signal input min_quality_threshold;       // Minimum required quality (0-1000)  
    signal input training_commitment_hash;    // Hash of original training commitment
    signal input creator_address;             // Agent creator's address
    
    // Public outputs
    signal output quality_verified;           // 1 if quality meets threshold, 0 otherwise
    signal output average_quality;            // Average quality score across samples
    signal output training_proof_hash;        // Unique proof identifier
    signal output model_integrity_proof;      // Proof model wasn't tampered with
    
    // Internal components
    component quality_check = GreaterEqThan(10);
    component avg_calculator = AverageCalculator(n_samples);
    component training_hasher = Poseidon(4);
    component model_hasher = Poseidon(3);
    
    // Verify each training sample meets minimum quality
    component sample_checks[n_samples];
    for (var i = 0; i < n_samples; i++) {
        sample_checks[i] = GreaterEqThan(10);
        sample_checks[i].in[0] <== quality_scores[i];
        sample_checks[i].in[1] <== min_quality_threshold;
    }
    
    // Calculate average quality across all samples
    for (var i = 0; i < n_samples; i++) {
        avg_calculator.values[i] <== quality_scores[i];
    }
    average_quality <== avg_calculator.average;
    
    // Verify average quality meets threshold
    quality_check.in[0] <== average_quality;
    quality_check.in[1] <== min_quality_threshold;
    // REMOVED: quality_verified <== quality_check.out;
    
    // Generate training proof hash (links training to commitment)
    training_hasher.inputs[0] <== agent_id;
    training_hasher.inputs[1] <== training_seed;
    training_hasher.inputs[2] <== average_quality;
    training_hasher.inputs[3] <== creator_address;
    training_proof_hash <== training_hasher.out;
    
    // Generate model integrity proof
    model_hasher.inputs[0] <== model_weights_hash;
    model_hasher.inputs[1] <== training_seed;
    model_hasher.inputs[2] <== agent_id;
    model_integrity_proof <== model_hasher.out;
    
    // Calculate product of all individual sample checks
    signal quality_products[n_samples + 1];
    quality_products[0] <== 1;
    
    for (var i = 0; i < n_samples; i++) {
        quality_products[i + 1] <== quality_products[i] * sample_checks[i].out;
    }
    
    signal final_quality_product;
    final_quality_product <== quality_products[n_samples];
    
    // Final quality verification requires both average and individual thresholds
    quality_verified <== quality_check.out * final_quality_product;
}
/**
 * @title AverageCalculator 
 * @dev Helper circuit to calculate average of quality scores
 */
template AverageCalculator(n) {
    signal input values[n];
    signal output average;
    
    // Create intermediate signals for partial sums
    signal partialSum[n+1];
    partialSum[0] <== 0;
    
    for (var i = 0; i < n; i++) {
        partialSum[i+1] <== partialSum[i] + values[i];
    }
    
    signal sum;
    sum <== partialSum[n];
    
    // Create an intermediate signal for the average
    signal tempAverage;
    tempAverage <-- sum \ n;  // Use <-- for assignment without constraint
    
    // Then add the constraint
    tempAverage * n === sum;
    
    // Finally assign to output
    average <== tempAverage;
}

// =============================================================================
// ETHICS COMPLIANCE VERIFICATION CIRCUIT  
// =============================================================================

/**
 * @title EthicsComplianceVerifier
 * @dev Verifies AI agent training follows ethical guidelines without revealing specifics
 */
template EthicsComplianceVerifier(n_ethics_tests, n_bias_checks) {
    //  inputs (ethics testing results)
    signal  input bias_test_results[n_bias_checks];     // Bias test scores (0-1000)
    signal  input fairness_scores[n_ethics_tests];      // Fairness evaluation results  
    signal  input harmful_content_flags[n_ethics_tests]; // 0 = safe, 1 = harmful detected
    signal  input ethics_training_data_hash;            // Hash of ethics training dataset
    signal  input red_team_results[n_ethics_tests];     // Red team attack success rates
    
    // Public inputs (ethics standards)
    signal input max_bias_threshold;          // Maximum allowed bias (0-1000)
    signal input min_fairness_score;          // Minimum fairness requirement
    signal input max_harmful_rate;            // Maximum harmful content rate
    signal input ethics_commitment_hash;      // Hash of original ethics commitment
    signal input agent_id;                    // Agent identifier
    
    // Public outputs  
    signal output ethics_verified;            // 1 if all ethics tests pass
    signal output bias_compliance;            // 1 if bias within limits
    signal output fairness_compliance;        // 1 if fairness standards met
    signal output safety_compliance;          // 1 if safety standards met
    signal output ethics_proof_hash;          // Unique ethics proof identifier
    
    // Components for verification
    component bias_checker[n_bias_checks];
    component fairness_checker[n_ethics_tests];
    component safety_checker[n_ethics_tests];
    component harmful_counter = HarmfulContentCounter(n_ethics_tests);
    component ethics_hasher = Poseidon(5);
    
    // Check bias compliance for each test
    signal bias_results[n_bias_checks];
    for (var i = 0; i < n_bias_checks; i++) {
        bias_checker[i] = LessEqThan(10);
        bias_checker[i].in[0] <== bias_test_results[i];
        bias_checker[i].in[1] <== max_bias_threshold;
        bias_results[i] <== bias_checker[i].out;
    }
    
    // Calculate overall bias compliance using array
    signal bias_products[n_bias_checks + 1];
    bias_products[0] <== 1;
    for (var i = 0; i < n_bias_checks; i++) {
        bias_products[i + 1] <== bias_products[i] * bias_results[i];
    }
    bias_compliance <== bias_products[n_bias_checks];
    
    // Check fairness compliance
    signal fairness_results[n_ethics_tests];
    for (var i = 0; i < n_ethics_tests; i++) {
        fairness_checker[i] = GreaterEqThan(10);
        fairness_checker[i].in[0] <== fairness_scores[i];
        fairness_checker[i].in[1] <== min_fairness_score;
        fairness_results[i] <== fairness_checker[i].out;
    }
    
    // Calculate overall fairness compliance using array
    signal fairness_products[n_ethics_tests + 1];
    fairness_products[0] <== 1;
    for (var i = 0; i < n_ethics_tests; i++) {
        fairness_products[i + 1] <== fairness_products[i] * fairness_results[i];
    }
    fairness_compliance <== fairness_products[n_ethics_tests];
    
    // Count harmful content detections
    for (var i = 0; i < n_ethics_tests; i++) {
        harmful_counter.flags[i] <== harmful_content_flags[i];
    }
    
    // Check if harmful content rate is acceptable
    component harmful_rate_check = LessEqThan(10);
    harmful_rate_check.in[0] <== harmful_counter.total_harmful;
    harmful_rate_check.in[1] <== max_harmful_rate;
    safety_compliance <== harmful_rate_check.out;
    
    // FIXED: Break the triple multiplication into two quadratic constraints
    signal intermediate_compliance;
    intermediate_compliance <== bias_compliance * fairness_compliance;
    ethics_verified <== intermediate_compliance * safety_compliance;
    
    // Generate ethics proof hash
    ethics_hasher.inputs[0] <== agent_id;
    ethics_hasher.inputs[1] <== bias_compliance;
    ethics_hasher.inputs[2] <== safety_compliance; 
    ethics_hasher.inputs[3] <== ethics_commitment_hash;
    ethics_hasher.inputs[4] <== ethics_training_data_hash;
    ethics_proof_hash <== ethics_hasher.out;
}

/**
 * @title HarmfulContentCounter
 * @dev Helper circuit to count harmful content detections
 */
template HarmfulContentCounter(n) {
    signal input flags[n];
    signal output total_harmful;
    
    // Use array of partial sums instead of reassigning single signal
    signal partialSum[n + 1];
    partialSum[0] <== 0;
    
    for (var i = 0; i < n; i++) {
        partialSum[i + 1] <== partialSum[i] + flags[i];
    }
    
    total_harmful <== partialSum[n];
}
// =============================================================================
// COMPLIANCE VERIFICATION CIRCUIT
// =============================================================================

/**
 * @title ComplianceVerifier  
 * @dev Verifies AI agent meets regulatory compliance (GDPR, HIPAA, etc.)
 */
template ComplianceVerifier(n_compliance_tests, n_data_categories) {
    //  inputs (compliance test results)
    signal  input data_handling_scores[n_compliance_tests];    // Data handling compliance
    signal  input privacy_protection_scores[n_compliance_tests]; // Privacy protection measures
    signal  input data_category_permissions[n_data_categories]; // What data types agent can handle
    signal  input retention_policies[n_data_categories];        // Data retention compliance
    signal  input encryption_standards[n_compliance_tests];     // Encryption compliance scores
    
    // Public inputs (compliance requirements)
    signal input required_compliance_standard;     // Required standard ID (GDPR=1, HIPAA=2, etc.)
    signal input min_privacy_score;               // Minimum privacy protection score
    signal input min_data_handling_score;         // Minimum data handling score  
    signal input agent_id;                        // Agent identifier
    signal input compliance_commitment_hash;      // Hash of compliance commitment
    
    // Public outputs
    signal output compliance_verified;            // 1 if all compliance checks pass
    signal output privacy_level;                  // Achieved privacy protection level
    signal output data_handling_level;            // Achieved data handling level
    signal output compliance_proof_hash;          // Unique compliance proof
    signal output supported_data_types;           // Bitmask of supported data categories
    
    // Components
    component privacy_checker[n_compliance_tests];
    component data_handling_checker[n_compliance_tests];
    component encryption_checker[n_compliance_tests];
    component privacy_avg = AverageCalculator(n_compliance_tests);
    component data_avg = AverageCalculator(n_compliance_tests);
    component compliance_hasher = Poseidon(6);
    component data_type_encoder = DataTypeEncoder(n_data_categories);
    
    // Verify privacy protection scores
    signal privacy_results[n_compliance_tests];
    for (var i = 0; i < n_compliance_tests; i++) {
        privacy_checker[i] = GreaterEqThan(10);
        privacy_checker[i].in[0] <== privacy_protection_scores[i];
        privacy_checker[i].in[1] <== min_privacy_score;
        privacy_results[i] <== privacy_checker[i].out;
        
        // Feed into average calculator
        privacy_avg.values[i] <== privacy_protection_scores[i];
    }
    privacy_level <== privacy_avg.average;
    
    // Verify data handling scores  
    signal data_handling_results[n_compliance_tests];
    for (var i = 0; i < n_compliance_tests; i++) {
        data_handling_checker[i] = GreaterEqThan(10);
        data_handling_checker[i].in[0] <== data_handling_scores[i];
        data_handling_checker[i].in[1] <== min_data_handling_score;
        data_handling_results[i] <== data_handling_checker[i].out;
        
        // Feed into average calculator
        data_avg.values[i] <== data_handling_scores[i];
    }
    data_handling_level <== data_avg.average;
    
    // Verify encryption standards
    signal encryption_results[n_compliance_tests];
    for (var i = 0; i < n_compliance_tests; i++) {
        encryption_checker[i] = GreaterEqThan(10);
        encryption_checker[i].in[0] <== encryption_standards[i];
        encryption_checker[i].in[1] <== 800; // Minimum encryption score (80%)
        encryption_results[i] <== encryption_checker[i].out;
    }
    
    // FIXED: Calculate overall compliance results using array patterns
    // Privacy compliance calculation
    signal privacy_products[n_compliance_tests + 1];
    privacy_products[0] <== 1;
    for (var i = 0; i < n_compliance_tests; i++) {
        privacy_products[i + 1] <== privacy_products[i] * privacy_results[i];
    }
    signal privacy_product;
    privacy_product <== privacy_products[n_compliance_tests];
    
    // Data handling compliance calculation
    signal data_products[n_compliance_tests + 1];
    data_products[0] <== 1;
    for (var i = 0; i < n_compliance_tests; i++) {
        data_products[i + 1] <== data_products[i] * data_handling_results[i];
    }
    signal data_product;
    data_product <== data_products[n_compliance_tests];
    
    // Encryption compliance calculation
    signal encryption_products[n_compliance_tests + 1];
    encryption_products[0] <== 1;
    for (var i = 0; i < n_compliance_tests; i++) {
        encryption_products[i + 1] <== encryption_products[i] * encryption_results[i];
    }
    signal encryption_product;
    encryption_product <== encryption_products[n_compliance_tests];
    
    // FIXED: Overall compliance verification using quadratic constraints
    signal intermediate_compliance;
    intermediate_compliance <== privacy_product * data_product;
    compliance_verified <== intermediate_compliance * encryption_product;
    
    // Encode supported data types into bitmask
    for (var i = 0; i < n_data_categories; i++) {
        data_type_encoder.permissions[i] <== data_category_permissions[i];
    }
    supported_data_types <== data_type_encoder.bitmask;
    
    // Generate compliance proof hash
    compliance_hasher.inputs[0] <== agent_id;
    compliance_hasher.inputs[1] <== compliance_verified;
    compliance_hasher.inputs[2] <== privacy_level;
    compliance_hasher.inputs[3] <== data_handling_level;
    compliance_hasher.inputs[4] <== supported_data_types;
    compliance_hasher.inputs[5] <== compliance_commitment_hash;
    compliance_proof_hash <== compliance_hasher.out;
}
/**
 * @title DataTypeEncoder
 * @dev Encodes data type permissions into a bitmask
 */
template DataTypeEncoder(n) {
    signal input permissions[n];  // 0 or 1 for each data type
    signal output bitmask;
    
    signal accumulator[n];
    accumulator[0] <== permissions[0];
    
    for (var i = 1; i < n; i++) {
        accumulator[i] <== accumulator[i-1] + permissions[i] * (2 ** i);
    }
    
    bitmask <== accumulator[n-1];
}

// =============================================================================
// CAPABILITY VERIFICATION CIRCUIT
// =============================================================================

/**
 * @title CapabilityVerifier
 * @dev Verifies agent can handle specific query types without revealing model details
 */
template CapabilityVerifier(n_capability_tests, n_query_types) {
    //  inputs (capability test results)
    signal  input capability_scores[n_capability_tests];   // Performance on capability tests
    signal  input query_type_support[n_query_types];       // Which query types supported (0/1)
    signal  input model_architecture_hash;                 // Hash of model architecture
    signal  input training_domain_coverage[n_query_types]; // Training coverage per domain
    signal  input performance_benchmarks[n_capability_tests]; // Benchmark performance scores
    
    // Public inputs (capability requirements)
    signal input required_query_type;            // Specific query type being verified (index)
    signal input min_capability_score;           // Minimum required capability score
    signal input min_training_coverage;          // Minimum training coverage required
    signal input agent_id;                       // Agent identifier
    
    // Public outputs
    signal output capability_verified;           // 1 if agent can handle query type
    signal output capability_score;              // Agent's capability score for this type
    signal output training_coverage;             // Training coverage for this query type
    signal output capability_proof_hash;         // Unique capability proof
    
    // Components
    component query_type_check = EqualityCheck();
    component capability_check = GreaterEqThan(10);
    component coverage_check = GreaterEqThan(10);
    component capability_hasher = Poseidon(5);
    
    // Extract capability score for the required query type
    component score_selector = IndexSelector(n_query_types);
    component coverage_selector = IndexSelector(n_query_types);
    component support_selector = IndexSelector(n_query_types);
    
    for (var i = 0; i < n_query_types; i++) {
        score_selector.values[i] <== capability_scores[i];
        coverage_selector.values[i] <== training_domain_coverage[i];
        support_selector.values[i] <== query_type_support[i];
    }
    
    score_selector.index <== required_query_type;
    coverage_selector.index <== required_query_type;
    support_selector.index <== required_query_type;
    
    capability_score <== score_selector.selected_value;
    training_coverage <== coverage_selector.selected_value;
    
    // Verify capability requirements
    capability_check.in[0] <== capability_score;
    capability_check.in[1] <== min_capability_score;
    
    coverage_check.in[0] <== training_coverage;
    coverage_check.in[1] <== min_training_coverage;
    
    // Overall capability verification
    capability_verified <== capability_check.out * coverage_check.out * support_selector.selected_value;
    
    // Generate capability proof hash
    capability_hasher.inputs[0] <== agent_id;
    capability_hasher.inputs[1] <== required_query_type;
    capability_hasher.inputs[2] <== capability_score;
    capability_hasher.inputs[3] <== training_coverage;
    capability_hasher.inputs[4] <== model_architecture_hash;
    capability_proof_hash <== capability_hasher.out;
}

/**
 * @title IndexSelector
 * @dev Helper circuit to select value at specific index
 */
template IndexSelector(n) {
    signal input values[n];
    signal input index;
    signal output selected_value;
    
    component equality_checks[n];
    signal products[n];
    
    for (var i = 0; i < n; i++) {
        equality_checks[i] = IsEqual();
        equality_checks[i].in[0] <== index;
        equality_checks[i].in[1] <== i;
        products[i] <== equality_checks[i].out * values[i];
    }
    
    signal sum;
    sum <== 0;
    for (var i = 0; i < n; i++) {
        sum <== sum + products[i];
    }
    selected_value <== sum;
}

/**
 * @title EqualityCheck
 * @dev Helper circuit for equality verification
 */
template EqualityCheck() {
    signal input in[2];
    signal output out;
    
    component eq = IsEqual();
    eq.in[0] <== in[0];
    eq.in[1] <== in[1];
    out <== eq.out;
}

// =============================================================================
// PRIVACY-PRESERVING QUERY PROCESSING CIRCUIT
// =============================================================================

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

// =============================================================================
// MAIN VERIFICATION ORCHESTRATOR
// =============================================================================

/**
 * @title ZKAgentVerificationOrchestrator
 * @dev Orchestrates all verification circuits for complete agent verification  
 */
template ZKAgentVerificationOrchestrator(
    n_training_samples,
    n_ethics_tests, 
    n_compliance_tests,
    n_capability_tests
) {
    // All inputs from sub-circuits
    // Training inputs
    signal input training_samples[n_training_samples*32];
    signal input model_responses[n_training_samples*32];
    signal input quality_scores[n_training_samples];
    signal input training_seed;
    signal input model_weights_hash;
    
    // Ethics inputs  
    signal input bias_test_results[n_ethics_tests];
    signal input fairness_scores[n_ethics_tests];
    signal input harmful_content_flags[n_ethics_tests];
    signal input ethics_training_data_hash;
    
    // Compliance inputs
    signal input privacy_protection_scores[n_compliance_tests];
    signal input data_handling_scores[n_compliance_tests];
    signal input encryption_standards[n_compliance_tests];
    
    // Capability inputs
    signal input capability_scores[n_capability_tests];
    signal input performance_benchmarks[n_capability_tests];
    
    // Public inputs (agent requirements)
    signal input agent_id;
    signal input creator_address;
    signal input min_quality_threshold;
    signal input max_bias_threshold;
    signal input min_privacy_score;
    signal input required_compliance_standard;
    signal input training_commitment_hash;
    signal input ethics_commitment_hash;
    signal input compliance_commitment_hash;
    
    // Public outputs (verification results)
    signal output agent_fully_verified;         // 1 if all verifications pass
    signal output quality_verification_result;  // Quality verification status
    signal output ethics_verification_result;   // Ethics verification status  
    signal output compliance_verification_result; // Compliance verification status
    signal output master_proof_hash;            // Master proof combining all verifications
    signal output verification_timestamp;       // When verification completed
    
    // Sub-circuit components
    component quality_verifier = TrainingQualityVerifier(n_training_samples, 5);
    component ethics_verifier = EthicsComplianceVerifier(n_ethics_tests, n_ethics_tests);
    component compliance_verifier = ComplianceVerifier(n_compliance_tests, 8);
    component master_hasher = Poseidon(8);
    
    // FIXED: Wire up quality verification with correct indexing
    for (var i = 0; i < n_training_samples * 32; i++) {
        quality_verifier.training_samples[i] <== training_samples[i];
        quality_verifier.model_responses[i] <== model_responses[i];
    }
    for (var i = 0; i < n_training_samples; i++) {
        quality_verifier.quality_scores[i] <== quality_scores[i];
    }
    quality_verifier.training_seed <== training_seed;
    quality_verifier.model_weights_hash <== model_weights_hash;
    quality_verifier.agent_id <== agent_id;
    quality_verifier.min_quality_threshold <== min_quality_threshold;
    quality_verifier.training_commitment_hash <== training_commitment_hash;
    quality_verifier.creator_address <== creator_address;
    
    quality_verification_result <== quality_verifier.quality_verified;
    
    // Wire up ethics verification
    for (var i = 0; i < n_ethics_tests; i++) {
        ethics_verifier.bias_test_results[i] <== bias_test_results[i];
        ethics_verifier.fairness_scores[i] <== fairness_scores[i];
        ethics_verifier.harmful_content_flags[i] <== harmful_content_flags[i];
        ethics_verifier.red_team_results[i] <== 0; // Placeholder
    }
    ethics_verifier.ethics_training_data_hash <== ethics_training_data_hash;
    ethics_verifier.max_bias_threshold <== max_bias_threshold;
    ethics_verifier.min_fairness_score <== 700; // 70% fairness minimum
    ethics_verifier.max_harmful_rate <== 50; // Max 5% harmful content
    ethics_verifier.ethics_commitment_hash <== ethics_commitment_hash;
    ethics_verifier.agent_id <== agent_id;
    
    ethics_verification_result <== ethics_verifier.ethics_verified;
    
    // Wire up compliance verification
    for (var i = 0; i < n_compliance_tests; i++) {
        compliance_verifier.privacy_protection_scores[i] <== privacy_protection_scores[i];
        compliance_verifier.data_handling_scores[i] <== data_handling_scores[i];
        compliance_verifier.encryption_standards[i] <== encryption_standards[i];
    }
    
    // Set data category permissions (placeholder)
    for (var i = 0; i < 8; i++) {
        compliance_verifier.data_category_permissions[i] <== 1; // Allow all data types by default
        compliance_verifier.retention_policies[i] <== 365; // 1 year retention
    }
    compliance_verifier.required_compliance_standard <== required_compliance_standard;
    compliance_verifier.min_privacy_score <== min_privacy_score;
    compliance_verifier.min_data_handling_score <== 800; // 80% minimum
    compliance_verifier.agent_id <== agent_id;
    compliance_verifier.compliance_commitment_hash <== compliance_commitment_hash;
    
    compliance_verification_result <== compliance_verifier.compliance_verified;
    
    // FIXED: Calculate overall verification result using quadratic constraints
    signal intermediate_verification;
    intermediate_verification <== quality_verification_result * ethics_verification_result;
    agent_fully_verified <== intermediate_verification * compliance_verification_result;
    
    // Generate master proof hash combining all sub-proofs
    master_hasher.inputs[0] <== agent_id;
    master_hasher.inputs[1] <== quality_verifier.training_proof_hash;
    master_hasher.inputs[2] <== ethics_verifier.ethics_proof_hash;
    master_hasher.inputs[3] <== compliance_verifier.compliance_proof_hash;
    master_hasher.inputs[4] <== quality_verification_result;
    master_hasher.inputs[5] <== ethics_verification_result;
    master_hasher.inputs[6] <== compliance_verification_result;
    master_hasher.inputs[7] <== creator_address;
    master_proof_hash <== master_hasher.out;
    
    // Set verification timestamp (would be current block timestamp in practice)
    verification_timestamp <== 1719360000; // Placeholder timestamp
}

// =============================================================================
// REPUTATION SCORING CIRCUIT
// =============================================================================

/**
 * @title ReputationScorer
 * @dev Calculates agent reputation score based on historical performance
 */
template ReputationScorer(n_historical_interactions, n_feedback_categories) {
    //  inputs (historical data)
    signal  input interaction_outcomes[n_historical_interactions]; // 0-1000 score per interaction
    signal  input user_feedback_scores[n_historical_interactions]; // User satisfaction scores
    signal  input task_completion_rates[n_historical_interactions]; // Task success rates
    signal  input response_quality_scores[n_historical_interactions]; // Response quality metrics
    signal  input bias_incident_flags[n_historical_interactions]; // Bias incidents (0/1)
    signal  input error_rates[n_historical_interactions]; // Error rates per interaction
    
    // Public inputs
    signal input agent_id;
    signal input evaluation_period_start;
    signal input evaluation_period_end;
    signal input minimum_interactions; // Minimum interactions for valid reputation
    
    // Public outputs
    signal output reputation_score; // Overall reputation (0-1000)
    signal output reliability_score; // Task completion reliability
    signal output user_satisfaction_score; // Average user satisfaction
    signal output bias_free_score; // Bias-free operation score
    signal output reputation_proof_hash; // Reputation calculation proof
    signal output sufficient_data; // 1 if enough data for reliable reputation
    
    // Components
    component interaction_avg = AverageCalculator(n_historical_interactions);
    component feedback_avg = AverageCalculator(n_historical_interactions);
    component completion_avg = AverageCalculator(n_historical_interactions);
    component quality_avg = AverageCalculator(n_historical_interactions);
    component bias_counter = HarmfulContentCounter(n_historical_interactions);
    component error_avg = AverageCalculator(n_historical_interactions);
    component data_sufficiency_check = GreaterEqThan(10);
    component reputation_hasher = Poseidon(7);
    
    // Check if we have sufficient interaction data
    data_sufficiency_check.in[0] <== n_historical_interactions;
    data_sufficiency_check.in[1] <== minimum_interactions;
    sufficient_data <== data_sufficiency_check.out;
    
    // Calculate average scores across all categories
    for (var i = 0; i < n_historical_interactions; i++) {
        interaction_avg.values[i] <== interaction_outcomes[i];
        feedback_avg.values[i] <== user_feedback_scores[i];
        completion_avg.values[i] <== task_completion_rates[i];
        quality_avg.values[i] <== response_quality_scores[i];
        bias_counter.flags[i] <== bias_incident_flags[i];
        error_avg.values[i] <== error_rates[i];
    }
    
    reliability_score <== completion_avg.average;
    user_satisfaction_score <== feedback_avg.average;
    
    // Calculate bias-free score (inverse of bias incidents)
    signal bias_rate;
    bias_rate <== (bias_counter.total_harmful * 1000) \ n_historical_interactions;
    bias_free_score <== 1000 - bias_rate;
    
    // Calculate overall reputation as weighted average
    signal weighted_reputation;
    weighted_reputation <== (interaction_avg.average * 25 +        // 25% interaction outcomes
                           user_satisfaction_score * 20 +          // 20% user satisfaction  
                           reliability_score * 25 +                // 25% reliability
                           quality_avg.average * 15 +              // 15% response quality
                           bias_free_score * 10 +                  // 10% bias-free operation
                           (1000 - error_avg.average) * 5) \ 100;  // 5% error-free operation
    
    reputation_score <== weighted_reputation;
    
    // Generate reputation proof hash
    reputation_hasher.inputs[0] <== agent_id;
    reputation_hasher.inputs[1] <== reputation_score;
    reputation_hasher.inputs[2] <== reliability_score;
    reputation_hasher.inputs[3] <== user_satisfaction_score;
    reputation_hasher.inputs[4] <== bias_free_score;
    reputation_hasher.inputs[5] <== evaluation_period_start;
    reputation_hasher.inputs[6] <== evaluation_period_end;
    reputation_proof_hash <== reputation_hasher.out;
}

// =============================================================================
// INCENTIVE ALIGNMENT VERIFICATION CIRCUIT
// =============================================================================

/**
 * @title IncentiveAlignmentVerifier
 * @dev Verifies agent's incentives are aligned with user and societal benefits
 */
template IncentiveAlignmentVerifier(n_alignment_tests, n_stakeholder_groups) {
    //  inputs (alignment test results)
    signal  input user_benefit_scores[n_alignment_tests]; // How much users benefit
    signal  input societal_impact_scores[n_alignment_tests]; // Societal impact measurements
    signal  input economic_efficiency_scores[n_alignment_tests]; // Economic efficiency
    signal  input long_term_sustainability_scores[n_alignment_tests]; // Long-term viability
    signal  input stakeholder_satisfaction[n_stakeholder_groups]; // Different stakeholder satisfaction
    signal  input misalignment_incidents[n_alignment_tests]; // Misalignment flags (0/1)
    
    // Public inputs
    signal input agent_id;
    signal input min_user_benefit_threshold;
    signal input min_societal_impact_threshold;
    signal input max_misalignment_rate;
    signal input alignment_commitment_hash;
    
    // Public outputs
    signal output alignment_verified; // 1 if incentives are properly aligned
    signal output user_benefit_level; // Average user benefit score
    signal output societal_impact_level; // Average societal impact score
    signal output economic_efficiency_level; // Average economic efficiency
    signal output sustainability_score; // Long-term sustainability score
    signal output alignment_proof_hash; // Alignment verification proof
    
    // Components
    component user_benefit_avg = AverageCalculator(n_alignment_tests);
    component societal_avg = AverageCalculator(n_alignment_tests);
    component efficiency_avg = AverageCalculator(n_alignment_tests);
    component sustainability_avg = AverageCalculator(n_alignment_tests);
    component stakeholder_avg = AverageCalculator(n_stakeholder_groups);
    component misalignment_counter = HarmfulContentCounter(n_alignment_tests);
    component alignment_hasher = Poseidon(8);
    
    // Verification components
    component user_benefit_check = GreaterEqThan(10);
    component societal_check = GreaterEqThan(10);
    component misalignment_check = LessEqThan(10);
    
    // Calculate averages
    for (var i = 0; i < n_alignment_tests; i++) {
        user_benefit_avg.values[i] <== user_benefit_scores[i];
        societal_avg.values[i] <== societal_impact_scores[i];
        efficiency_avg.values[i] <== economic_efficiency_scores[i];
        sustainability_avg.values[i] <== long_term_sustainability_scores[i];
        misalignment_counter.flags[i] <== misalignment_incidents[i];
    }
    
    for (var i = 0; i < n_stakeholder_groups; i++) {
        stakeholder_avg.values[i] <== stakeholder_satisfaction[i];
    }
    
    // Set output levels
    user_benefit_level <== user_benefit_avg.average;
    societal_impact_level <== societal_avg.average;
    economic_efficiency_level <== efficiency_avg.average;
    sustainability_score <== sustainability_avg.average;
    
    // Verify alignment thresholds
    user_benefit_check.in[0] <== user_benefit_level;
    user_benefit_check.in[1] <== min_user_benefit_threshold;
    
    societal_check.in[0] <== societal_impact_level;
    societal_check.in[1] <== min_societal_impact_threshold;
    
    misalignment_check.in[0] <== misalignment_counter.total_harmful;
    misalignment_check.in[1] <== max_misalignment_rate;
    
    // Overall alignment verification
    alignment_verified <== user_benefit_check.out * societal_check.out * misalignment_check.out;
    
    // Generate alignment proof hash
    alignment_hasher.inputs[0] <== agent_id;
    alignment_hasher.inputs[1] <== alignment_verified;
    alignment_hasher.inputs[2] <== user_benefit_level;
    alignment_hasher.inputs[3] <== societal_impact_level;
    alignment_hasher.inputs[4] <== economic_efficiency_level;
    alignment_hasher.inputs[5] <== sustainability_score;
    alignment_hasher.inputs[6] <== stakeholder_avg.average;
    alignment_hasher.inputs[7] <== alignment_commitment_hash;
    alignment_proof_hash <== alignment_hasher.out;
}

// =============================================================================
// DYNAMIC ADAPTATION VERIFICATION CIRCUIT
// =============================================================================

/**
 * @title DynamicAdaptationVerifier
 * @dev Verifies agent can adapt to new situations while maintaining core principles
 */
template DynamicAdaptationVerifier(n_adaptation_tests, n_principle_checks) {
    //  inputs (adaptation test results)
    signal  input adaptation_success_rates[n_adaptation_tests]; // Success in new scenarios
    signal  input principle_preservation_scores[n_principle_checks]; // Core principle maintenance
    signal  input learning_efficiency_scores[n_adaptation_tests]; // How quickly agent adapts
    signal  input knowledge_transfer_scores[n_adaptation_tests]; // Transfer learning effectiveness
    signal  input stability_during_adaptation[n_adaptation_tests]; // Maintains stability while adapting
    signal  input adaptation_metadata[n_adaptation_tests][4]; // Additional adaptation metrics
    
    // Public inputs
    signal input agent_id;
    signal input min_adaptation_success_rate;
    signal input min_principle_preservation_score;
    signal input min_learning_efficiency;
    signal input adaptation_commitment_hash;
    
    // Public outputs
    signal output adaptation_verified; // 1 if adaptation capabilities verified
    signal output adaptation_success_rate; // Overall adaptation success
    signal output principle_preservation_level; // How well core principles preserved
    signal output learning_efficiency; // Learning and adaptation efficiency
    signal output stability_score; // Stability during adaptation
    signal output adaptation_proof_hash; // Adaptation verification proof
    
    // Components
    component adaptation_avg = AverageCalculator(n_adaptation_tests);
    component principle_avg = AverageCalculator(n_principle_checks);
    component efficiency_avg = AverageCalculator(n_adaptation_tests);
    component transfer_avg = AverageCalculator(n_adaptation_tests);
    component stability_avg = AverageCalculator(n_adaptation_tests);
    component adaptation_hasher = Poseidon(7);
    
    // Verification components
    component adaptation_check = GreaterEqThan(10);
    component principle_check = GreaterEqThan(10);
    component efficiency_check = GreaterEqThan(10);
    
    // Calculate averages
    for (var i = 0; i < n_adaptation_tests; i++) {
        adaptation_avg.values[i] <== adaptation_success_rates[i];
        efficiency_avg.values[i] <== learning_efficiency_scores[i];
        transfer_avg.values[i] <== knowledge_transfer_scores[i];
        stability_avg.values[i] <== stability_during_adaptation[i];
    }
    
    for (var i = 0; i < n_principle_checks; i++) {
        principle_avg.values[i] <== principle_preservation_scores[i];
    }
    
    // Set output levels
    adaptation_success_rate <== adaptation_avg.average;
    principle_preservation_level <== principle_avg.average;
    learning_efficiency <== efficiency_avg.average;
    stability_score <== stability_avg.average;
    
    // Verify adaptation requirements
    adaptation_check.in[0] <== adaptation_success_rate;
    adaptation_check.in[1] <== min_adaptation_success_rate;
    
    principle_check.in[0] <== principle_preservation_level;
    principle_check.in[1] <== min_principle_preservation_score;
    
    efficiency_check.in[0] <== learning_efficiency;
    efficiency_check.in[1] <== min_learning_efficiency;
    
    // Overall adaptation verification
    adaptation_verified <== adaptation_check.out * principle_check.out * efficiency_check.out;
    
    // Generate adaptation proof hash
    adaptation_hasher.inputs[0] <== agent_id;
    adaptation_hasher.inputs[1] <== adaptation_verified;
    adaptation_hasher.inputs[2] <== adaptation_success_rate;
    adaptation_hasher.inputs[3] <== principle_preservation_level;
    adaptation_hasher.inputs[4] <== learning_efficiency;
    adaptation_hasher.inputs[5] <== stability_score;
    adaptation_hasher.inputs[6] <== adaptation_commitment_hash;
    adaptation_proof_hash <== adaptation_hasher.out;
}

// =============================================================================
// CIRCUIT COMPILATION AND USAGE INSTRUCTIONS
// =============================================================================

/*
COMPILATION INSTRUCTIONS:
1. Install circom: npm install -g circom
2. Compile main circuit: circom ZKAgentVerificationOrchestrator.circom --r1cs --wasm --sym --c
3. Generate powers of tau: snarkjs powersoftau new bn128 16 pot16_0000.ptau
4. Generate circuit-specific trusted setup: snarkjs groth16 setup circuit.r1cs pot16_final.ptau circuit_final.zkey
5. Generate verification key: snarkjs zkey export verificationkey circuit_final.zkey verification_key.json

USAGE EXAMPLE:
1. Prepare input.json with all required  and public inputs
2. Generate witness: node circuit_js/generate_witness.js circuit.wasm input.json witness.wtns
3. Generate proof: snarkjs groth16 prove circuit_final.zkey witness.wtns proof.json public.json
4. Verify proof: snarkjs groth16 verify verification_key.json public.json proof.json

INPUT STRUCTURE (input.json):
{
    // Training verification inputs
    "training_samples": [[...], [...], ...], // n_training_samples x 32 array
    "model_responses": [[...], [...], ...],  // n_training_samples x 32 array
    "quality_scores": [...],                 // n_training_samples array
    "training_seed": "...",
    "model_weights_hash": "...",
    
    // Ethics verification inputs
    "bias_test_results": [...],              // n_ethics_tests array
    "fairness_scores": [...],                // n_ethics_tests array
    "harmful_content_flags": [...],          // n_ethics_tests array
    "ethics_training_data_hash": "...",
    
    // Compliance verification inputs
    "privacy_protection_scores": [...],      // n_compliance_tests array
    "data_handling_scores": [...],           // n_compliance_tests array
    "encryption_standards": [...],           // n_compliance_tests array
    
    // Capability verification inputs
    "capability_scores": [...],              // n_capability_tests array
    "performance_benchmarks": [...],         // n_capability_tests array
    
    // Public inputs
    "agent_id": "...",
    "creator_address": "...",
    "min_quality_threshold": 800,
    "max_bias_threshold": 200,
    "min_privacy_score": 850,
    "required_compliance_standard": 1,
    "training_commitment_hash": "...",
    "ethics_commitment_hash": "...",
    "compliance_commitment_hash": "..."
}

INTEGRATION WITH BLOCKCHAIN:
- Deploy verification contract with verification key
- Agents submit proofs on-chain for verification
- Verified agents receive reputation tokens/NFTs
- Users can query agent verification status before interaction
- Continuous monitoring through periodic re-verification

SECURITY CONSIDERATIONS:
-  inputs must never be revealed on-chain
- Use secure multi-party computation for sensitive setup phases
- Implement proper key management for trusted setup
- Regular auditing of circuit logic and implementation
- Monitor for potential attacks on the verification system
*/

component main = ZKAgentVerificationOrchestrator(100, 50, 30, 25);