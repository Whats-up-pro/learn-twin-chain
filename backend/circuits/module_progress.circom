pragma circom 2.1.4;

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

template ModuleProgress() {
    // Public inputs
    signal input moduleId;
    signal input courseId;  // Added: Link to course structure
    signal input studentHash;
    signal input minScoreRequired;
    signal input maxTimeAllowed;
    signal input maxAttemptsAllowed;
    signal input commitmentHash;
    signal input learningDataHash;

    // Private inputs
    signal input score;
    signal input timeSpent;
    signal input attempts;
    signal input studyMaterials;
    signal input studentAddress;  // Changed from studentPrivateKey
    signal input randomNonce;

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

    // Score validation
    component scoreCheck = GreaterThan(8);
    scoreCheck.in[0] <== score;
    scoreCheck.in[1] <== minScoreRequired;

    // Time validation
    component timeCheck = LessThan(16);
    timeCheck.in[0] <== timeSpent;
    timeCheck.in[1] <== maxTimeAllowed;

    // Attempts validation
    component attemptsCheck = LessThan(8);
    attemptsCheck.in[0] <== attempts;
    attemptsCheck.in[1] <== maxAttemptsAllowed;

    // All conditions must be met including hash verification
    signal temp1;
    signal temp2;
    temp1 <== scoreCheck.out * timeCheck.out;
    temp2 <== temp1 * attemptsCheck.out;
    isValid <== temp2 * hashCheck.out;
}

component main { public [moduleId, courseId, studentHash, minScoreRequired, maxTimeAllowed, maxAttemptsAllowed, commitmentHash, learningDataHash] } = ModuleProgress();