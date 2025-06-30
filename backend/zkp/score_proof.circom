pragma circom 2.0.0;
include "circomlib/circuits/comparators.circom";

template ScoreProof() {
    signal input score;
    signal input min_score;
    signal output is_valid;

    component cmp = GreaterEqThan(32);
    cmp.in[0] <== score;
    cmp.in[1] <== min_score;
    is_valid <== cmp.out;
}

component main = ScoreProof();