#!/usr/bin/env python3
"""
Update .env file with deployed contract addresses
"""

import json
import os

def update_env_with_contracts():
    """Update .env file with contract addresses from deployment"""
    
    # Read deployment addresses
    try:
        with open('deployment_addresses.json', 'r') as f:
            deployment_data = json.load(f)
    except FileNotFoundError:
        print("❌ deployment_addresses.json not found!")
        print("Please run deployment first: python deploy_contracts.py")
        return
    
    # Read current .env
    env_file = '.env'
    if not os.path.exists(env_file):
        print(f"❌ {env_file} not found!")
        print("Please create .env file first")
        return
    
    with open(env_file, 'r') as f:
        content = f.read()
    
    # Update contract addresses
    lines = content.split('\n')
    updated = False
    
    for i, line in enumerate(lines):
        if line.startswith('MODULE_PROGRESS_CONTRACT_ADDRESS='):
            lines[i] = f'MODULE_PROGRESS_CONTRACT_ADDRESS={deployment_data["contracts"]["MODULE_PROGRESS_CONTRACT_ADDRESS"]}'
            updated = True
        elif line.startswith('ACHIEVEMENT_CONTRACT_ADDRESS='):
            lines[i] = f'ACHIEVEMENT_CONTRACT_ADDRESS={deployment_data["contracts"]["ACHIEVEMENT_CONTRACT_ADDRESS"]}'
            updated = True
        elif line.startswith('REGISTRY_CONTRACT_ADDRESS='):
            lines[i] = f'REGISTRY_CONTRACT_ADDRESS={deployment_data["contracts"]["REGISTRY_CONTRACT_ADDRESS"]}'
            updated = True
    
    # If addresses not found, add them
    if not updated:
        lines.append(f'MODULE_PROGRESS_CONTRACT_ADDRESS={deployment_data["contracts"]["MODULE_PROGRESS_CONTRACT_ADDRESS"]}')
        lines.append(f'ACHIEVEMENT_CONTRACT_ADDRESS={deployment_data["contracts"]["ACHIEVEMENT_CONTRACT_ADDRESS"]}')
        lines.append(f'REGISTRY_CONTRACT_ADDRESS={deployment_data["contracts"]["REGISTRY_CONTRACT_ADDRESS"]}')
    
    # Write updated .env
    with open(env_file, 'w') as f:
        f.write('\n'.join(lines))
    
    print("✅ Updated .env with contract addresses:")
    print(f"  MODULE_PROGRESS_CONTRACT_ADDRESS: {deployment_data['contracts']['MODULE_PROGRESS_CONTRACT_ADDRESS']}")
    print(f"  ACHIEVEMENT_CONTRACT_ADDRESS: {deployment_data['contracts']['ACHIEVEMENT_CONTRACT_ADDRESS']}")
    print(f"  REGISTRY_CONTRACT_ADDRESS: {deployment_data['contracts']['REGISTRY_CONTRACT_ADDRESS']}")
    print(f"\n📝 Updated {env_file} successfully!")

if __name__ == "__main__":
    update_env_with_contracts() 