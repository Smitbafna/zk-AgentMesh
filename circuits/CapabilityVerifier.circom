

pragma circom 2.0.0;



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