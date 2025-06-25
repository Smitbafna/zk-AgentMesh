
// =============================================================================
// DYNAMIC ADAPTATION VERIFICATION CIRCUIT
// =============================================================================

pragma circom 2.0.0;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/bitify.circom";

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

