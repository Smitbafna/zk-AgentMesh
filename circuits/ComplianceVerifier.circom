// =============================================================================
// COMPLIANCE VERIFICATION CIRCUIT
// =============================================================================


pragma circom 2.0.0;


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