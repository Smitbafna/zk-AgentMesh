pragma circom 2.0.0;

include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/bitify.circom";

include "./TrainingQualityVerifier.circom";
include "./EthicsComplianceVerifier.circom";
include "./ComplianceVerifier.circom";


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