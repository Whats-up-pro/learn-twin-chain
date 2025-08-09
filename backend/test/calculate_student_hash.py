#!/usr/bin/env python3
"""
Calculate correct student hash for debugging
"""
import subprocess
import json
from pathlib import Path

def calculate_student_hash(student_private_key, random_nonce):
    """Calculate student hash using Poseidon"""
    script_content = f"""
const circomlibjs = require('circomlibjs');

async function calculateStudentHash() {{
    try {{
        const poseidon = await circomlibjs.buildPoseidon();
        const inputs = [{student_private_key}, {random_nonce}];
        const hash = poseidon(inputs);
        
        // Convert to field element
        const fieldSize = BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617');
        let hashBigInt;
        
        if (hash instanceof Uint8Array) {{
            hashBigInt = BigInt('0x' + Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join(''));
        }} else if (Array.isArray(hash)) {{
            hashBigInt = BigInt('0x' + hash.map(b => b.toString(16).padStart(2, '0')).join(''));
        }} else {{
            hashBigInt = BigInt(hash);
        }}
        
        const fieldHash = hashBigInt % fieldSize;
        console.log('STUDENT_HASH:' + fieldHash.toString());
    }} catch (error) {{
        console.log('ERROR:' + error.message);
    }}
}}

calculateStudentHash();
"""
    
    # Write script to temporary file
    script_path = Path("temp_student_hash.js")
    with open(script_path, 'w') as f:
        f.write(script_content)
    
    try:
        # Run the script
        result = subprocess.run(
            ['node', str(script_path)],
            cwd=Path.cwd(),
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode != 0:
            raise Exception(f"Hash calculation failed: {result.stderr}")
        
        output = result.stdout.strip()
        if output.startswith('STUDENT_HASH:'):
            hash_str = output.replace('STUDENT_HASH:', '')
            if ',' in hash_str:
                hash_array = hash_str.split(',')
                return int(hash_array[0].strip())
            else:
                return int(hash_str)
        else:
            raise Exception(f"Unexpected output: {output}")
    
    finally:
        # Clean up
        try:
            script_path.unlink()
        except:
            pass

def main():
    # Load current input
    with open('circuits/module_progress_input.json', 'r') as f:
        input_data = json.load(f)
    
    print("Current input data:")
    print(json.dumps(input_data, indent=2))
    
    # Calculate correct student hash
    print("\nCalculating correct student hash...")
    correct_student_hash = calculate_student_hash(
        input_data['studentPrivateKey'], 
        input_data['randomNonce']
    )
    print(f"Calculated student hash: {correct_student_hash}")
    print(f"Current student hash: {input_data['studentHash']}")
    print(f"Match: {correct_student_hash == input_data['studentHash']}")
    
    if correct_student_hash != input_data['studentHash']:
        print("\nUpdating input with correct student hash...")
        input_data['studentHash'] = correct_student_hash
        
        # Save updated input
        with open('circuits/module_progress_input.json', 'w') as f:
            json.dump(input_data, f, indent=2)
        
        print("Updated input data with correct student hash:")
        print(json.dumps(input_data, indent=2))
    else:
        print("\nStudent hash is already correct!")

if __name__ == "__main__":
    main() 