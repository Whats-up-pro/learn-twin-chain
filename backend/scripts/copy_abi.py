#!/usr/bin/env python3
"""
Script to copy ABI files from artifacts to abi directory
"""

import json
import os
import shutil
from pathlib import Path

def copy_abi_files():
    """Copy ABI files from artifacts to abi directory"""
    try:
        print("📋 Copying ABI files from artifacts to abi directory...")
        
        # Define source and destination directories
        artifacts_dir = Path("artifacts/contracts")
        abi_dir = Path("contracts/abi")
        
        # Create abi directory if it doesn't exist
        abi_dir.mkdir(parents=True, exist_ok=True)
        
        # List of contracts to copy ABI for
        contracts_to_copy = [
            "ZKLearningVerifier.sol/ZKLearningVerifier",
            "ModuleProgressNFT.sol/ModuleProgressNFT", 
            "LearningAchievementNFT.sol/LearningAchievementNFT",
            "LearningDataRegistry.sol/LearningDataRegistry",
            "DigitalTwinRegistry.sol/DigitalTwinRegistry",
            "ZKPCertificateRegistry.sol/ZKPCertificateRegistry",
            "verifiers/module_progress_verifier.sol/ModuleProgressVerifier",
            "verifiers/learning_achievement_verifier.sol/LearningAchievementVerifier"
        ]
        
        copied_count = 0
        
        for contract_path in contracts_to_copy:
            # Source file path
            source_file = artifacts_dir / f"{contract_path}.json"
            
            # Extract contract name for destination
            contract_name = contract_path.split('/')[-1]
            dest_file = abi_dir / f"{contract_name}.json"
            
            if source_file.exists():
                try:
                    # Read the artifact file
                    with open(source_file, 'r') as f:
                        artifact_data = json.load(f)
                    
                    # Extract ABI
                    abi_data = {
                        "contractName": contract_name,
                        "abi": artifact_data.get('abi', []),
                        "bytecode": artifact_data.get('bytecode', ''),
                        "deployedBytecode": artifact_data.get('deployedBytecode', '')
                    }
                    
                    # Write ABI file
                    with open(dest_file, 'w') as f:
                        json.dump(abi_data, f, indent=2)
                    
                    print(f"✅ Copied ABI for {contract_name}")
                    copied_count += 1
                    
                except Exception as e:
                    print(f"❌ Error copying ABI for {contract_name}: {str(e)}")
            else:
                print(f"⚠️  Artifact not found for {contract_name}: {source_file}")
        
        print(f"\n📊 Summary: {copied_count} ABI files copied successfully")
        
        # List all files in abi directory
        print("\n📁 Files in abi directory:")
        for file in abi_dir.glob("*.json"):
            print(f"  - {file.name}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error copying ABI files: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main function"""
    print("🔧 ABI Copy Tool")
    print("=" * 50)
    
    if copy_abi_files():
        print("\n🎉 ABI files copied successfully!")
    else:
        print("\n❌ Failed to copy ABI files")

if __name__ == "__main__":
    main() 