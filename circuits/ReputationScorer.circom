// =============================================================================
// REPUTATION SCORING CIRCUIT
// =============================================================================



pragma circom 2.0.0;



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
