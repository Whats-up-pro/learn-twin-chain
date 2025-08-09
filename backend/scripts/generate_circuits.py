#!/usr/bin/env python3
"""
Script để tái generate circuits và verifier contracts sau khi sửa circuits
"""

import os
import subprocess
import sys
from pathlib import Path

def run_command(cmd, cwd=None, check=True):
    """Run a command and return the result"""
    print(f"🔧 Running: {' '.join(cmd)}")
    try:
        result = subprocess.run(cmd, cwd=cwd, check=check, capture_output=True, text=True)
        if result.stdout:
            print(f"✅ Output: {result.stdout}")
        return result
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e}")
        if e.stdout:
            print(f"📝 Stdout: {e.stdout}")
        if e.stderr:
            print(f"📝 Stderr: {e.stderr}")
        if check:
            raise
        return e

def main():
    """Main function to regenerate circuits"""
    
    # Get directories
    backend_dir = Path(__file__).parent.parent
    circuits_dir = backend_dir / "circuits"
    node_modules_bin = backend_dir / "node_modules" / ".bin"
    
    print("🚀 Starting Circuit Regeneration Process")
    print("="*60)
    
    # Change to circuits directory
    os.chdir(circuits_dir)
    print(f"📁 Working directory: {circuits_dir}")
    
    # Create verifiers directory if it doesn't exist
    verifiers_dir = circuits_dir / "verifiers"
    verifiers_dir.mkdir(exist_ok=True)
    print(f"📁 Created verifiers directory: {verifiers_dir}")
    
    # Step 1: Compile circuits
    print("\n🔧 Step 1: Compiling circuits...")
    
    circuits_to_compile = [
        "module_progress.circom",
        "learning_achievement.circom"
    ]
    
    compiled_circuits = []
    for circuit in circuits_to_compile:
        print(f"\n📋 Compiling {circuit}...")
        
        # Generate witness calculator
        compile_cmd = [
            "circom", circuit,
            "--r1cs", "--wasm", "--sym", "--c",
            "--output", ".",
            "-l", "../node_modules"  # Include node_modules path (relative to circuits directory)
        ]
        
        result = run_command(compile_cmd, check=False)
        if result.returncode != 0:
            print(f"❌ Failed to compile {circuit}")
            continue
        else:
            print(f"✅ Successfully compiled {circuit}")
            compiled_circuits.append(circuit.replace('.circom', ''))
    
    # Step 2: Generate verifier contracts
    print("\n🔧 Step 2: Generating verifier contracts...")
    
    circuits_info = [
        {
            "name": "module_progress",
            "zkey": "zkp_keys/module_progress_proving_key.zkey",
            "output": "verifiers/module_progress_verifier.sol"
        },
        {
            "name": "learning_achievement", 
            "zkey": "zkp_keys/learning_achievement_proving_key.zkey",
            "output": "verifiers/learning_achievement_verifier.sol"
        }
    ]
    
    for circuit_info in circuits_info:
        print(f"\n📋 Generating verifier for {circuit_info['name']}...")
        
        # Check if zkey file exists
        zkey_path = circuits_dir / circuit_info["zkey"]
        if not zkey_path.exists():
            print(f"❌ Zkey file not found: {zkey_path}")
            continue
        
        # Generate verifier contract using snarkjs from node_modules with -l option
        snarkjs_path = node_modules_bin / "snarkjs"
        if os.name == 'nt':  # Windows
            snarkjs_path = node_modules_bin / "snarkjs.cmd"
        
        verifier_cmd = [
            str(snarkjs_path), "zkey", "export", "solidityverifier",
            circuit_info["zkey"],
            circuit_info["output"],
            "-l"  # Include node modules path
        ]
        
        result = run_command(verifier_cmd, check=False)
        if result.returncode != 0:
            print(f"❌ Failed to generate verifier for {circuit_info['name']}")
            continue
        else:
            print(f"✅ Successfully generated verifier for {circuit_info['name']}")
    
    # Step 3: Copy verifier contracts to main contracts directory
    print("\n🔧 Step 3: Copying verifier contracts...")
    
    contracts_dir = backend_dir / "contracts" / "verifiers"
    contracts_dir.mkdir(exist_ok=True)
    
    for circuit_info in circuits_info:
        src_file = circuits_dir / circuit_info["output"]
        dst_file = contracts_dir / f"{circuit_info['name']}_verifier.sol"
        
        if src_file.exists():
            # Copy file
            import shutil
            shutil.copy2(src_file, dst_file)
            print(f"✅ Copied {src_file.name} to {dst_file}")
        else:
            print(f"❌ Source file not found: {src_file}")
    
    print("\n🎉 Circuit regeneration completed!")
    print("📝 Next steps:")
    print("   1. Redeploy contracts using: node scripts/deploy.js")
    print("   2. Update deployment addresses")
    print("   3. Run tests to verify")

if __name__ == "__main__":
    main()