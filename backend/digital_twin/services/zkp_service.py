import os
import json
import subprocess
import tempfile
from typing import Dict, Any, List
from pathlib import Path
import hashlib
import time
import secrets

class PoseidonHash:
    """Poseidon hash implementation using circomlibjs via Node.js"""
    
    def __init__(self):
        self.backend_dir = Path(__file__).parent.parent.parent
    
    def hash(self, inputs: List[int]) -> int:
        """
        Calculate Poseidon hash of inputs using circomlibjs
        """
        try:
            # Create temporary script for Poseidon hash calculation
            script_content = f"""
const circomlibjs = require('circomlibjs');

async function calculatePoseidon() {{
    try {{
        const poseidon = await circomlibjs.buildPoseidon();
        const inputs = {inputs};
        const hash = poseidon(inputs);
        
        // Convert hash to proper format
        let hashStr;
        if (Array.isArray(hash)) {{
            // Convert array to hex string, then to BigInt
            const hexStr = '0x' + hash.map(b => b.toString(16).padStart(2, '0')).join('');
            hashStr = BigInt(hexStr).toString();
        }} else if (hash instanceof Uint8Array) {{
            // Convert Uint8Array to hex string, then to BigInt
            const hexStr = '0x' + Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
            hashStr = BigInt(hexStr).toString();
        }} else {{
            // Already a BigInt or number
            hashStr = hash.toString();
        }}
        console.log('HASH_RESULT:' + hashStr);
    }} catch (error) {{
        console.log('ERROR:' + error.message);
        console.log('ERROR_STACK:' + error.stack);
    }}
}}

calculatePoseidon().catch(error => {{
    console.log('PROMISE_ERROR:' + error.message);
}});
"""
            
            # Write script to temporary file
            script_path = self.backend_dir / "temp_poseidon.js"
            with open(script_path, 'w') as f:
                f.write(script_content)
                
            # Run the script
            result = subprocess.run(
                ['node', str(script_path)],
                cwd=str(self.backend_dir),
                capture_output=True,
                text=True,
                timeout=10
            )
            
            # Clean up
            try:
                script_path.unlink()
            except:
                pass
            
            if result.returncode != 0:
                raise Exception(f"Poseidon hash calculation failed: {result.stderr}")
            
            # Parse result
            output = result.stdout.strip()
            lines = output.split('\n')
            
            for line in lines:
                if line.startswith('HASH_RESULT:'):
                    hash_str = line.replace('HASH_RESULT:', '').strip()
                    return int(hash_str)
                elif line.startswith('ERROR:') or line.startswith('PROMISE_ERROR:'):
                    error_msg = line.split(':', 1)[1] if ':' in line else line
                raise Exception(f"Poseidon hash error: {error_msg}")
            
            raise Exception(f"No hash result found in output: {output}")
                
        except Exception as e:
            raise Exception(f"Poseidon hash calculation failed: {str(e)}")

class ZKPService:
    def __init__(self):
        self.circuits_dir = Path(__file__).parent.parent.parent / "circuits"
        self.keys_dir = self.circuits_dir / "zkp_keys"
        self.snarkjs_path = "snarkjs"
        self.poseidon_hash = PoseidonHash()

        # Circuit paths
        self.module_progress_circuit = self.circuits_dir / "module_progress.circom"
        self.learning_achievement_circuit = self.circuits_dir / "learning_achievement.circom"

        # Ensure directories exist
        self.circuits_dir.mkdir(exist_ok=True)
        self.keys_dir.mkdir(exist_ok=True)
    
    def _get_snarkjs_env(self) -> dict:
        env = os.environ.copy()
        return env
    
    def _generate_secure_nonce(self) -> int:
        p = 21888242871839275222246405745257275088548364400416034343698204186575808495617
        entropy_bytes = secrets.token_bytes(32)
        entropy_int = int.from_bytes(entropy_bytes, byteorder='big')
        time_entropy = int(time.time() * 1000000)
        process_entropy = os.getpid()
        combined_entropy = entropy_int ^ time_entropy ^ process_entropy
        nonce = combined_entropy % p
        return nonce
    
    def _create_commitment_hash(self, private_inputs: List[int]) -> int:
        p = 21888242871839275222246405745257275088548364400416034343698204186575808495617
        input_bytes = b''
        for val in private_inputs:
            val_bytes = val.to_bytes(32, byteorder='big')
            input_bytes += val_bytes
        sha_hash = hashlib.sha256(input_bytes).hexdigest()
        hash_int = int(sha_hash, 16)
        commitment = hash_int % p
        return commitment

    def generate_module_progress_proof(self, completion_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate ZK proof for module progress using student signature verification"""
        try:
            print("🔐 Generating module progress ZK proof...")
            
            # Extract data from completion_data
            score = int(completion_data.get('score', 0))
            time_spent = int(completion_data.get('time_spent', 0))
            attempts = int(completion_data.get('attempts', 0))
            module_id = completion_data.get('module_id', '')
            student_address = completion_data.get('student_address', '')
            student_signature = completion_data.get('student_signature', '')  # New field
            challenge_nonce = completion_data.get('challenge_nonce', '')  # New field
            study_materials = completion_data.get('study_materials', [])
            min_score_required = int(completion_data.get('min_score_required', 80))
            max_time_allowed = int(completion_data.get('max_time_allowed', 3600))
            max_attempts_allowed = int(completion_data.get('max_attempts_allowed', 10))

            # Verify student signature first (only if provided)
            if student_signature and challenge_nonce:
                if not self._verify_student_signature(student_address, challenge_nonce, student_signature):
                    return {"success": False, "error": "Invalid student signature"}

            # Generate secure nonce for ZKP
            random_nonce = self._generate_secure_nonce()
            
            # Calculate student_hash using student address + nonce (instead of private key)
            student_address_int = int(student_address.lower().replace('0x', ''), 16)
            student_hash = self.poseidon_hash.hash([student_address_int, random_nonce])
            
            private_inputs = [score, time_spent, attempts, len(study_materials), student_address_int, random_nonce]
            commitment_hash = self._create_commitment_hash(private_inputs)
            
            # learning_data_hash: for one-popup flow, bind proof to off-chain data hash instead of session hash
            # Backward compatible: if 'learning_data_hash' present use it; otherwise keep existing behavior
            learning_session_hash: int
            provided_learning_data_hash = completion_data.get('learning_data_hash')
            if provided_learning_data_hash is not None:
                try:
                    if isinstance(provided_learning_data_hash, str):
                        h = provided_learning_data_hash.lower()
                        if h.startswith('0x'):
                            learning_session_hash = int(h, 16)
                        else:
                            learning_session_hash = int(h, 16)
                    elif isinstance(provided_learning_data_hash, bytes):
                        learning_session_hash = int.from_bytes(provided_learning_data_hash, byteorder='big')
                    else:
                        learning_session_hash = int(provided_learning_data_hash)
                except Exception:
                    learning_session_hash = int(hashlib.sha256((module_id + str(time.time())).encode()).hexdigest()[:16], 16)
            else:
                # Fallback: previous behavior using provided on-chain session hash if any
                provided_session_hash = completion_data.get('learning_session_hash')
                if provided_session_hash is not None:
                    try:
                        if isinstance(provided_session_hash, str):
                            h = provided_session_hash.lower()
                            if h.startswith('0x'):
                                learning_session_hash = int(h, 16)
                            else:
                                learning_session_hash = int(h, 16)
                        elif isinstance(provided_session_hash, bytes):
                            learning_session_hash = int.from_bytes(provided_session_hash, byteorder='big')
                        else:
                            learning_session_hash = int(provided_session_hash)
                    except Exception:
                        learning_session_hash = int(hashlib.sha256((module_id + str(time.time())).encode()).hexdigest()[:16], 16)
                else:
                    learning_session_hash = int(hashlib.sha256((module_id + str(time.time())).encode()).hexdigest()[:16], 16)
            
            # Generate courseId from module_id (or use a default course mapping)
            course_id = completion_data.get('course_id', 'default_course')
            course_id_hash = int(hashlib.sha256(course_id.encode()).hexdigest()[:16], 16)
            
            input_data = {
                "score": score,
                "timeSpent": time_spent,
                "attempts": attempts,
                "studyMaterials": int(len(study_materials)),
                "studentAddress": student_address_int,  # Changed from studentPrivateKey
                "randomNonce": random_nonce,
                "moduleId": int(hashlib.sha256(module_id.encode()).hexdigest()[:16], 16),
                "courseId": course_id_hash,  # Added missing courseId
                "studentHash": int(student_hash),
                "minScoreRequired": min_score_required,
                "maxTimeAllowed": max_time_allowed,
                "maxAttemptsAllowed": max_attempts_allowed,
                "commitmentHash": int(commitment_hash),
                # For one-popup flow, bind to learningDataHash (renamed public input)
                "learningDataHash": learning_session_hash
            }
            
            # Save input to file
            input_file = self.circuits_dir / "module_progress_input.json"
            with open(input_file, 'w') as f:
                json.dump(input_data, f, indent=2)
            
            public_inputs = [
                input_data["moduleId"],
                input_data["courseId"],  # Added missing courseId
                input_data["studentHash"],
                input_data["minScoreRequired"],
                input_data["maxTimeAllowed"],
                input_data["maxAttemptsAllowed"],
                input_data["commitmentHash"],
                input_data["learningDataHash"]
            ]
            public_inputs_file = self.circuits_dir / "module_progress_public.json"
            with open(public_inputs_file, 'w') as f:
                json.dump(public_inputs, f)
            
            # Check required files
            wasm_file = self.circuits_dir / "module_progress_js" / "module_progress.wasm"
            witness_script = self.circuits_dir / "module_progress_js" / "generate_witness.js"
            if not wasm_file.exists():
                return {"success": False, "error": f"WASM file not found: {wasm_file}"}
            if not witness_script.exists():
                return {"success": False, "error": f"Witness generation script not found: {witness_script}"}
            
            # Generate witness
            witness_cmd = [
                "node", str(witness_script),
                str(wasm_file),
                str(input_file),
                str(self.circuits_dir / "module_progress_witness.wtns")
            ]
            result = subprocess.run(
                witness_cmd,
                cwd=str(self.circuits_dir),
                env=self._get_snarkjs_env(),
                capture_output=True,
                text=True,
                shell=True
            )
            if result.returncode != 0:
                error_msg = f"Witness generation failed. Return code: {result.returncode}"
                if result.stderr:
                    error_msg += f". Error: {result.stderr}"
                if result.stdout:
                    error_msg += f". Output: {result.stdout}"
                return {"success": False, "error": error_msg}
            
            # Generate proof
            proof_cmd = [
                self.snarkjs_path, "groth16", "prove",
                str(self.keys_dir / "module_progress_proving_key.zkey"),
                "module_progress_witness.wtns",
                "module_progress_proof.json",
                "module_progress_public.json"
            ]
            result = subprocess.run(
                proof_cmd,
                cwd=self.circuits_dir,
                env=self._get_snarkjs_env(),
                capture_output=True,
                text=True,
                shell=True
            )
            if result.returncode != 0:
                error_msg = f"Proof generation failed. Return code: {result.returncode}"
                if result.stderr:
                    error_msg += f". Error: {result.stderr}"
                if result.stdout:
                    error_msg += f". Output: {result.stdout}"
                return {"success": False, "error": error_msg}
            
            # Load proof and public inputs
            with open(self.circuits_dir / "module_progress_proof.json", 'r') as f:
                proof_data = json.load(f)
            with open(self.circuits_dir / "module_progress_public.json", 'r') as f:
                public_data = json.load(f)
            
            enhanced_proof = {
                "success": True,
                "circuit_type": "module_progress",
                "proof": {
                    "pi_a": proof_data["pi_a"],
                    "pi_b": proof_data["pi_b"],
                    "pi_c": proof_data["pi_c"],
                    "protocol": "groth16",
                    "curve": "bn128"
                },
                "public_inputs": public_data,
                "commitment_hash": commitment_hash,
                "student_hash": student_hash,
                "metadata": {
                    "module_id": module_id,
                    "student_address": student_address,
                    "timestamp": int(time.time())
                }
            }
            return enhanced_proof
        except Exception as e:
            return {"success": False, "error": str(e)}

    def generate_learning_achievement_proof(self, achievement_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a zero-knowledge proof for learning achievement using learning_achievement.circom with signature verification
        """
        try:
            # Prepare inputs
            total_modules = int(achievement_data.get('total_modules', 0))
            average_score = int(achievement_data.get('average_score', 0))
            practice_hours = int(achievement_data.get('practice_hours', 0))
            student_address = achievement_data.get('student_address', '')
            student_signature = achievement_data.get('student_signature', '')  # New field
            challenge_nonce = achievement_data.get('challenge_nonce', '')  # New field
            min_modules_required = int(achievement_data.get('min_modules_required', 3))
            min_average_score = int(achievement_data.get('min_average_score', 75))
            min_practice_hours = int(achievement_data.get('min_practice_hours', 20))

            # Verify student signature first
            if student_signature and challenge_nonce:
                if not self._verify_student_signature(student_address, challenge_nonce, student_signature):
                    return {"success": False, "error": "Invalid student signature"}

            # Generate secure nonce for ZKP
            random_nonce = self._generate_secure_nonce()
            
            # Calculate student_hash using student address + nonce (instead of private key)
            student_address_int = int(student_address.lower().replace('0x', ''), 16)
            student_hash = self.poseidon_hash.hash([student_address_int, random_nonce])
            
            private_inputs = [total_modules, average_score, practice_hours, student_address_int, random_nonce]
            commitment_hash = self._create_commitment_hash(private_inputs)
            
            # Generate additional required inputs for the circuit
            total_study_time = int(achievement_data.get('total_study_time', practice_hours * 2))
            skill_specific_modules = int(achievement_data.get('skill_specific_modules', total_modules))
            skill_mastery_level = int(achievement_data.get('skill_mastery_level', min(average_score, 95)))
            practical_projects = int(achievement_data.get('practical_projects', 2))
            skill_type = int(achievement_data.get('skill_type', 1))  # Default to 1 for general skill
            
            # Generate additional required inputs for the circuit
            achievement_timestamp = int(time.time())
            achievement_level = skill_mastery_level // 20  # Convert to achievement level (1-5)
            
            input_data = {
                "totalModulesCompleted": total_modules,
                "averageScore": average_score,
                "totalStudyTime": total_study_time,
                "skillSpecificModules": skill_specific_modules,
                "practiceHours": practice_hours,
                "studentAddress": student_address_int,  # Changed from studentPrivateKey
                "randomNonce": random_nonce,
                "skillMasteryLevel": skill_mastery_level,
                "practicalProjects": practical_projects,
                "skillType": skill_type,
                "studentHash": int(student_hash),
                "minModulesRequired": min_modules_required,
                "minAverageScore": min_average_score,
                "minPracticeHours": min_practice_hours,
                "commitmentHash": int(commitment_hash),
                "achievementTimestamp": achievement_timestamp,
                "achievementLevel": achievement_level
            }
            
            input_file = self.circuits_dir / "learning_achievement_input.json"
            with open(input_file, 'w') as f:
                json.dump(input_data, f, indent=2)
            
            # Public inputs must include the circuit's output signal (isValid) as the last element
            # to match the verifier contract (9 public signals expected)
            public_inputs = [
                input_data["skillType"],
                input_data["studentHash"],
                input_data["minModulesRequired"],
                input_data["minAverageScore"],
                input_data["minPracticeHours"],
                input_data["commitmentHash"],
                input_data["achievementTimestamp"],
                input_data["achievementLevel"],
                1  # isValid output (expected to be 1 for valid proofs)
            ]
            public_inputs_file = self.circuits_dir / "learning_achievement_public.json"
            with open(public_inputs_file, 'w') as f:
                json.dump(public_inputs, f)

            # Check required files
            wasm_file = self.circuits_dir / "learning_achievement_js" / "learning_achievement.wasm"
            witness_script = self.circuits_dir / "learning_achievement_js" / "generate_witness.js"
            if not wasm_file.exists():
                return {"success": False, "error": f"WASM file not found: {wasm_file}"}
            if not witness_script.exists():
                return {"success": False, "error": f"Witness generation script not found: {witness_script}"}

            # Generate witness
            witness_cmd = [
                "node", str(witness_script),
                str(wasm_file),
                str(input_file),
                str(self.circuits_dir / "learning_achievement_witness.wtns")
            ]
            result = subprocess.run(
                witness_cmd,
                cwd=str(self.circuits_dir),
                env=self._get_snarkjs_env(),
                capture_output=True,
                text=True,
                shell=True
            )
            if result.returncode != 0:
                error_msg = f"Witness generation failed. Return code: {result.returncode}"
                if result.stderr:
                    error_msg += f". Error: {result.stderr}"
                if result.stdout:
                    error_msg += f". Output: {result.stdout}"
                return {"success": False, "error": error_msg}
            
            # Generate proof
            proof_cmd = [
                self.snarkjs_path, "groth16", "prove",
                str(self.keys_dir / "learning_achievement_proving_key.zkey"),
                "learning_achievement_witness.wtns",
                "learning_achievement_proof.json",
                "learning_achievement_public.json"
            ]
            result = subprocess.run(
                proof_cmd,
                cwd=self.circuits_dir,
                env=self._get_snarkjs_env(),
                capture_output=True,
                text=True,
                shell=True
            )
            if result.returncode != 0:
                error_msg = f"Proof generation failed. Return code: {result.returncode}"
                if result.stderr:
                    error_msg += f". Error: {result.stderr}"
                if result.stdout:
                    error_msg += f". Output: {result.stdout}"
                return {"success": False, "error": error_msg}
            
            # Load proof and public inputs (snarkjs writes the computed public signals)
            proof_file = self.circuits_dir / "learning_achievement_proof.json"
            with open(proof_file, 'r') as f:
                proof_data = json.load(f)
            with open(self.circuits_dir / "learning_achievement_public.json", 'r') as f:
                public_data = json.load(f)
            
            # Return enhanced proof with additional metadata
            enhanced_proof = {
                "success": True,
                "proof": proof_data,
                "public_inputs": public_data,
                "commitment_hash": str(commitment_hash),
                "student_hash": str(student_hash),
                "metadata": {
                    "circuit": "learning_achievement",
                    "total_modules": total_modules,
                    "average_score": average_score,
                    "practice_hours": practice_hours,
                    "skill_type": skill_type,
                    "achievement_level": achievement_level,
                    "timestamp": int(time.time())
                }
            }
            return enhanced_proof
        except Exception as e:
            return {"success": False, "error": str(e)}

    def _verify_student_signature(self, student_address: str, challenge_nonce: str, signature: str) -> bool:
        """Verify student signature using Ethereum message signing"""
        try:
            from eth_account.messages import encode_defunct
            from eth_account import Account
            
            # Create the message that should have been signed
            message = f"LearnTwin Module Completion Challenge: {challenge_nonce}"
            message_hash = encode_defunct(text=message)
            
            # Recover the address from signature
            recovered_address = Account.recover_message(message_hash, signature=signature)
            
            # Check if recovered address matches student address
            return recovered_address.lower() == student_address.lower()
        except Exception as e:
            print(f"❌ Signature verification failed: {str(e)}")
            return False

    def verify_proof(self, proof: Dict[str, Any], public_inputs: List[int] = None, circuit_type: str = "module_progress") -> Dict[str, Any]:
        """
        Verify a ZK proof using snarkjs
        
        Args:
            proof: Either the enhanced proof dict (with keys 'proof' and optional 'public_inputs')
                   or the raw proof object containing 'pi_a', 'pi_b', 'pi_c'
            public_inputs: Optional list of public inputs corresponding to the proof
            circuit_type: Type of circuit (module_progress or learning_achievement)
        
        Returns:
            Dictionary with verification result
        """
        try:
            # Normalize input proof/public_inputs to raw proof object + list of public signals
            raw_proof = None
            public_signals = public_inputs if public_inputs is not None else []

            if proof is None:
                raise Exception("Proof data is required")

            if isinstance(proof, dict) and "proof" in proof and ("pi_a" not in proof or "pi_b" not in proof or "pi_c" not in proof):
                # Enhanced proof format
                raw_proof = proof["proof"]
                if not public_signals:
                    public_signals = proof.get("public_inputs", proof.get("publicSignals", []))
            else:
                # Raw proof format
                raw_proof = proof
                if not public_signals:
                    public_signals = proof.get("public_inputs", proof.get("publicSignals", []))

            if not public_signals:
                raise Exception("Public inputs are required for verification")
            
            # Write proof to temporary file
            proof_file = self.circuits_dir / f"temp_proof_{circuit_type}.json"
            with open(proof_file, 'w') as f:
                json.dump(raw_proof, f, indent=2)
            
            # Write public inputs to temporary file
            public_file = self.circuits_dir / f"temp_public_{circuit_type}.json"
            with open(public_file, 'w') as f:
                json.dump(public_signals, f, indent=2)
            
            # Choose verification key based on circuit type
            if circuit_type == "learning_achievement":
                vkey_file = self.keys_dir / "learning_achievement_verification_key.json"
            else:
                vkey_file = self.keys_dir / "module_progress_verification_key.json"
            
            # Verify proof using snarkjs
            verify_cmd = [
                self.snarkjs_path, "groth16", "verify",
                str(vkey_file),
                str(public_file),
                str(proof_file)
            ]
            
            result = subprocess.run(
                verify_cmd,
                cwd=self.circuits_dir,
                env=self._get_snarkjs_env(),
                capture_output=True,
                text=True,
                shell=True
            )
            
            # Clean up temporary files
            try:
                proof_file.unlink()
                public_file.unlink()
            except:
                pass
            
            if result.returncode == 0 and "OK" in result.stdout:
                return {"success": True, "valid": True, "message": "Proof verification successful"}
            else:
                return {"success": True, "valid": False, "message": f"Proof verification failed: {result.stdout}"}
            
        except Exception as e:
            return {"success": False, "error": str(e)}