// =============================================================================
// ETHICS COMPLIANCE VERIFICATION CIRCUIT  
// =============================================================================

pragma circom 2.0.0;

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