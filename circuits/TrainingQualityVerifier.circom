pragma circom 2.0.0;


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