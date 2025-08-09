#!/usr/bin/env python3
"""
Simple test script for witness generation
"""
import subprocess
import json
from pathlib import Path

def test_witness_generation():
    """Test witness generation with corrected input"""
    print("🧪 Testing Witness Generation")
    print("=" * 50)
    
    try:
        # Check if input file exists
        input_file = Path("circuits/module_progress_input.json")
        if not input_file.exists():
            print(f"❌ Input file not found: {input_file}")
            return False
        
        # Load and display input data
        with open(input_file, 'r') as f:
            input_data = json.load(f)
        
        print("📋 Input data:")
        print(json.dumps(input_data, indent=2))
        
        # Run witness generation
        print("\n🔧 Running witness generation...")
        
        # Use absolute paths
        wasm_file = Path.cwd() / "circuits" / "module_progress_js" / "module_progress.wasm"
        input_file = Path.cwd() / "circuits" / "module_progress_input.json"
        output_file = Path.cwd() / "circuits" / "module_progress_witness.wtns"
        
        print(f"   WASM file: {wasm_file}")
        print(f"   Input file: {input_file}")
        print(f"   Output file: {output_file}")
        
        result = subprocess.run(
            ['node', 'circuits/module_progress_js/generate_witness.js',
             str(wasm_file), str(input_file), str(output_file)],
            cwd=Path.cwd(),
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            print("✅ Witness generation successful!")
            
            # Check if witness file was created
            witness_file = Path.cwd() / "circuits" / "module_progress_witness.wtns"
            if witness_file.exists():
                print(f"✅ Witness file created: {witness_file}")
                print(f"   File size: {witness_file.stat().st_size} bytes")
            else:
                print("⚠️  Witness file not found")
                print(f"   Expected path: {witness_file}")
                # List files in circuits directory
                circuits_dir = Path.cwd() / "circuits"
                if circuits_dir.exists():
                    print(f"   Files in circuits directory:")
                    for file in circuits_dir.iterdir():
                        if file.is_file():
                            print(f"     - {file.name}")
            
            return True
        else:
            print("❌ Witness generation failed:")
            print(f"   Error: {result.stderr}")
            print(f"   Output: {result.stdout}")
            return False
            
    except Exception as e:
        print(f"❌ Witness generation test failed: {str(e)}")
        return False

def test_proof_generation():
    """Test proof generation after witness"""
    print("\n🧪 Testing Proof Generation")
    print("=" * 50)
    
    try:
        # Check if witness file exists
        witness_file = Path.cwd() / "circuits" / "module_progress_witness.wtns"
        if not witness_file.exists():
            print("❌ Witness file not found, run witness generation first")
            print(f"   Expected path: {witness_file}")
            return False
        
        # Check if proving key exists
        proving_key = Path.cwd() / "circuits" / "zkp_keys" / "module_progress_proving_key.zkey"
        if not proving_key.exists():
            print("❌ Proving key not found")
            print(f"   Expected path: {proving_key}")
            return False
        
        print("🔧 Running proof generation...")
        result = subprocess.run(
            ['snarkjs', 'groth16', 'prove',
             str(proving_key),
             str(witness_file),
             str(Path.cwd() / "circuits" / "module_progress_proof.json"),
             str(Path.cwd() / "circuits" / "module_progress_public.json")],
            cwd=Path.cwd(),
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode == 0:
            print("✅ Proof generation successful!")
            
            # Check if proof files were created
            proof_file = Path.cwd() / "circuits" / "module_progress_proof.json"
            public_file = Path.cwd() / "circuits" / "module_progress_public.json"
            
            if proof_file.exists():
                print(f"✅ Proof file created: {proof_file}")
                with open(proof_file, 'r') as f:
                    proof_data = json.load(f)
                print(f"   Proof components: {len(proof_data.get('pi_a', []))} elements")
            
            if public_file.exists():
                print(f"✅ Public inputs file created: {public_file}")
                with open(public_file, 'r') as f:
                    public_data = json.load(f)
                print(f"   Public inputs: {public_data}")
            
            return True
        else:
            print("❌ Proof generation failed:")
            print(f"   Error: {result.stderr}")
            print(f"   Output: {result.stdout}")
            return False
            
    except Exception as e:
        print(f"❌ Proof generation test failed: {str(e)}")
        return False

def main():
    """Main test function"""
    print("🚀 Starting ZKP Circuit Tests")
    print("=" * 70)
    
    # Test witness generation
    witness_success = test_witness_generation()
    
    if witness_success:
        # Test proof generation
        proof_success = test_proof_generation()
        
        if proof_success:
            print("\n🎉 All ZKP tests passed!")
            print("✅ Witness generation: PASSED")
            print("✅ Proof generation: PASSED")
            return True
        else:
            print("\n❌ Proof generation failed")
            return False
    else:
        print("\n❌ Witness generation failed")
        return False

if __name__ == "__main__":
    main() 