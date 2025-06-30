from fastapi import APIRouter, Body, HTTPException
import subprocess
import json
import os

# Thêm đường dẫn nodejs và npm global vào PATH
os.environ["PATH"] += os.pathsep + r"C:\Program Files\nodejs"
os.environ["PATH"] += os.pathsep + r"C:\Users\KHANH\AppData\Roaming\npm"
NODE_PATH = r"C:\Program Files\nodejs\node.exe"
SNARKJS_PATH = r"C:\Users\KHANH\AppData\Roaming\npm\snarkjs.cmd"

router = APIRouter()

ZKP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../zkp'))

@router.post("/zkp/prove-score")
def prove_score(score: int = Body(...), min_score: int = Body(...)):
    """
    Sinh proof ZKP chứng minh score >= min_score.
    """
    try:
        # 1. Tạo input.json
        input_data = {"score": score, "min_score": min_score}
        with open(os.path.join(ZKP_DIR, "input.json"), "w") as f:
            json.dump(input_data, f)
        # 2. Sinh witness
        subprocess.run([
            NODE_PATH, "score_proof_js/generate_witness.js",
            "score_proof_js/score_proof.wasm",
            "input.json", "witness.wtns"
        ], cwd=ZKP_DIR, check=True)
        # 3. Sinh proof
        subprocess.run([
            SNARKJS_PATH, "groth16", "prove",
            "score_proof_0000.zkey", "witness.wtns",
            "proof.json", "public.json"
        ], cwd=ZKP_DIR, check=True)
        # 4. Đọc proof và public
        with open(os.path.join(ZKP_DIR, "proof.json")) as f:
            proof = json.load(f)
        with open(os.path.join(ZKP_DIR, "public.json")) as f:
            public = json.load(f)
        return {"proof": proof, "public": public}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ZKP proof error: {e}")

@router.post("/zkp/verify-score")
def verify_score(proof: dict = Body(...), public: list = Body(...)):
    """
    Xác minh proof ZKP.
    """
    try:
        with open(os.path.join(ZKP_DIR, "proof.json"), "w") as f:
            json.dump(proof, f)
        with open(os.path.join(ZKP_DIR, "public.json"), "w") as f:
            json.dump(public, f)
        result = subprocess.run([
            SNARKJS_PATH, "groth16", "verify",
            "verification_key.json", "public.json", "proof.json"
        ], cwd=ZKP_DIR, capture_output=True, text=True)
        print("CMD:", result.args)
        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)
        print("Return code:", result.returncode)
        if "OK" in result.stdout:
            return {"valid": True, "log": result.stdout}
        else:
            return {"valid": False, "log": result.stdout + result.stderr}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ZKP verify error: {e}") 