import json
import time
from ecdsa import SigningKey, SECP256k1
import base64


def create_vc(issuer_did, student_did, skill, metadata, private_key_hex):
    vc = {
        "@context": [
            "https://www.w3.org/2018/credentials/v1",
            "https://schema.org"
        ],
        "id": f"urn:uuid:{int(time.time())}",
        "type": ["VerifiableCredential", "SkillCredential"],
        "issuer": issuer_did,
        "issuanceDate": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "credentialSubject": {
            "id": student_did,
            "skill": skill,
            "metadata": metadata
        }
    }
    # Ký số
    sk = SigningKey.from_string(bytes.fromhex(private_key_hex), curve=SECP256k1)
    message = json.dumps(vc, sort_keys=True).encode()
    signature = sk.sign(message)
    vc["proof"] = {
        "type": "EcdsaSecp256k1Signature2019",
        "created": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "proofPurpose": "assertionMethod",
        "verificationMethod": issuer_did + "#key-1",
        "jws": base64.b64encode(signature).decode()
    }
    return vc 