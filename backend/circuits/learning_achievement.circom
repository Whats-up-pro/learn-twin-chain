pragma circom 2.1.4;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

template LearningAchievement() {
    // Public inputs
    signal input skillType;
    signal input studentHash;
    signal input minModulesRequired;
    signal input minAverageScore;
    signal input minPracticeHours;
    signal input commitmentHash;
    signal input achievementTimestamp;
    signal input achievementLevel;

    // Private inputs
    signal input totalModulesCompleted;
    signal input averageScore;
    signal input totalStudyTime;
    signal input skillSpecificModules;
    signal input practiceHours;
    signal input studentAddress;  // Changed from studentPrivateKey
    signal input randomNonce;
    signal input skillMasteryLevel;
    signal input practicalProjects;

    // Outputs
    signal output isValid;

    // Component for Poseidon hash to verify studentHash
    component poseidon = Poseidon(2);
    poseidon.inputs[0] <== studentAddress;  // Changed from studentPrivateKey
    poseidon.inputs[1] <== randomNonce;
    
    // Verify that the provided studentHash matches the computed hash
    component hashCheck = IsEqual();
    hashCheck.in[0] <== studentHash;
    hashCheck.in[1] <== poseidon.out;

    // Module validation
    component moduleCheck = GreaterThan(8);
    moduleCheck.in[0] <== totalModulesCompleted;
    moduleCheck.in[1] <== minModulesRequired;

    // Score validation
    component scoreCheck = GreaterThan(8);
    scoreCheck.in[0] <== averageScore;
    scoreCheck.in[1] <== minAverageScore;

    // Practice hours validation
    component practiceCheck = GreaterThan(12);
    practiceCheck.in[0] <== practiceHours;
    practiceCheck.in[1] <== minPracticeHours;

    // All conditions must be met including hash verification
    signal temp1;
    signal temp2;
    temp1 <== moduleCheck.out * scoreCheck.out;
    temp2 <== temp1 * practiceCheck.out;
    isValid <== temp2 * hashCheck.out;
}

component main { public [skillType, studentHash, minModulesRequired, minAverageScore, minPracticeHours, commitmentHash, achievementTimestamp, achievementLevel] } = LearningAchievement(); 