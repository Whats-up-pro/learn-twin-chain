# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from models import UpdateTwinRequest, LLMQuery, NFTMintRequest, VerifierRequest, QuizResult
from services import update_digital_twin, query_llm_agent, mint_skill_nft, verify_digital_twin_data, process_quiz_result
# from config import config # Assuming you have a config file

app = Flask(__name__)
CORS(app) # Enable CORS for frontend interaction
# app.config.from_object(config) # Load configuration

@app.route('/update-twin', methods=['POST'])
def update_twin_route():
    """API endpoint for updating the digital twin."""
    try:
        # Lấy chữ ký từ header Authorization
        auth_header = request.headers.get('Authorization')
        signature = auth_header.split(' ')[1] if auth_header and ' ' in auth_header else None
        if not signature:
            return jsonify({"message": "Authorization header missing or invalid"}), 401

        update_data = UpdateTwinRequest(**request.json)
        # Pass signature to the service function
        success = update_digital_twin(update_data, signature=signature)
        success = update_digital_twin(update_data) # Tạm thời bỏ qua chữ ký

        if success:
            return jsonify({"message": "Digital twin updated successfully"}), 200
        else:
            return jsonify({"message": "Failed to update digital twin"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/process-quiz', methods=['POST'])
def process_quiz_route():
    """API endpoint for processing quiz results."""
    try:
        quiz_result_data = QuizResult(**request.json)
        success = process_quiz_result(quiz_result_data)
        if success:
            return jsonify({"message": "Quiz result processed and digital twin updated"}), 200
        else:
            return jsonify({"message": "Failed to process quiz result"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/query-llm', methods=['POST'])
def query_llm_route():
    """API endpoint for querying the LLM agent."""
    try:
        query_data = LLMQuery(**request.json)
        response = query_llm_agent(query_data)
        return jsonify(response.dict()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/mint-nft', methods=['POST'])
def mint_nft_route():
    """API endpoint for minting a skill NFT."""
    try:
        mint_request = NFTMintRequest(**request.json)
        response = mint_skill_nft(mint_request)
        if response.success:
            return jsonify(response.dict()), 200
        else:
             return jsonify(response.dict()), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/verify-twin', methods=['POST'])
def verify_twin_route():
    """API endpoint for verifying digital twin data."""
    try:
        verifier_request = VerifierRequest(**request.json)
        response = verify_digital_twin_data(verifier_request)
        return jsonify(response.dict()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Add other API endpoints as needed (e.g., for retrieving twin data)
@app.route('/get-twin/<string:twin_id>', methods=['GET'])
def get_twin_route(twin_id: str):
    """API endpoint for retrieving digital twin data."""
    try:
        twin_data = get_digital_twin(twin_id)
        if twin_data:
            return jsonify(twin_data.dict()), 200
        else:
            return jsonify({"message": "Digital twin not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True) # Set debug=False in production
