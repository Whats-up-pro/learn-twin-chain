#!/usr/bin/env python3
"""
Detailed debug script for witness generation issues
"""

import json
import subprocess
import sys
from pathlib import Path

def test_witness_generation_detailed():
    """Test witness generation with detailed debugging"""

    # Get circuits directory
    circuits_dir = Path(__file__).parent.parent / "circuits"

    # Create minimal test input with smaller numbers
    test_input = {
        "score": 85,
        "timeSpent": 3600,
        "attempts": 2,
        "studyMaterials": 2,
        "studentPrivateKey": 123,  # Much smaller number
        "randomNonce": 456,        # Much smaller number
        "moduleId": 789,           # Much smaller number
        "studentHash": 321,        # Much smaller number
        "minScoreRequired": 80,
        "maxTimeAllowed": 7200,
        "maxAttemptsAllowed": 10
    }

    # Save test input
    input_file = circuits_dir / "debug_input_detailed.json"
    with open(input_file, 'w') as f:
        json.dump(test_input, f, indent=2)

    print(f"🔍 Test input saved to: {input_file}")
    print(f"🔍 Input data: {json.dumps(test_input, indent=2)}")

    # Try to generate witness
    witness_cmd = [
        "node", "learning_achievement_js/generate_witness.js",
        "learning_achievement_js/learning_achievement.wasm",
        "debug_input_detailed.json",
        "debug_witness_detailed.wtns"
    ]

    print(f"🔍 Executing: {' '.join(witness_cmd)}")
    print(f"🔍 Working directory: {circuits_dir}")

    try:
        result = subprocess.run(
            witness_cmd,
            cwd=circuits_dir,
            capture_output=True,
            text=True,
            timeout=30
        )

        print(f"🔍 Return code: {result.returncode}")
        print(f"🔍 stdout: {result.stdout}")
        print(f"🔍 stderr: {result.stderr}")

        if result.returncode == 0:
            print("✅ Witness generation successful!")
        else:
            print("❌ Witness generation failed!")

    except subprocess.TimeoutExpired:
        print("❌ Witness generation timed out!")
    except Exception as e:
        print(f"❌ Exception: {str(e)}")

    # Also try with string values to see if that helps
    test_input_strings = {
        "score": "85",
        "timeSpent": "3600",
        "attempts": "2",
        "studyMaterials": "2",
        "studentPrivateKey": "123",
        "randomNonce": "456",
        "moduleId": "789",
        "studentHash": "321",
        "minScoreRequired": "80",
        "maxTimeAllowed": "7200",
        "maxAttemptsAllowed": "10"
    }

    input_file_strings = circuits_dir / "debug_input_strings.json"
    with open(input_file_strings, 'w') as f:
        json.dump(test_input_strings, f, indent=2)

    print(f"\n🔍 Testing with string values...")
    print(f"🔍 Input data: {json.dumps(test_input_strings, indent=2)}")

    witness_cmd_strings = [
        "node", "learning_achievement_js/generate_witness.js",
        "learning_achievement_js/learning_achievement.wasm",
        "debug_input_strings.json",
        "debug_witness_strings.wtns"
    ]

    try:
        result_strings = subprocess.run(
            witness_cmd_strings,
            cwd=circuits_dir,
            capture_output=True,
            text=True,
            timeout=30
        )

        print(f"🔍 Return code: {result_strings.returncode}")
        print(f"🔍 stdout: {result_strings.stdout}")
        print(f"🔍 stderr: {result_strings.stderr}")

        if result_strings.returncode == 0:
            print("✅ Witness generation with strings successful!")
        else:
            print("❌ Witness generation with strings failed!")

    except subprocess.TimeoutExpired:
        print("❌ Witness generation with strings timed out!")
    except Exception as e:
        print(f"❌ Exception: {str(e)}")

if __name__ == "__main__":
    test_witness_generation_detailed() 