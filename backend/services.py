# backend/services.py
from models import DigitalTwin, UpdateTwinRequest, LLMQuery, LLMResponse, NFTMintRequest, NFTMintResponse, VerifierRequest, VerifierResponse, PythonProgress, PythonSkill, LearningBehavior, LLMInteraction, QuizResult, NFTMetadata
from web3 import Web3
# import ipfshttpclient # Cần cài đặt thư viện ipfshttpclient
# import requests # Để gọi API LLM (ví dụ: OpenAI)
from typing import Dict, List, Optional
import requests
import os
from datetime import datetime
# Cần thư viện cho DID và xác thực chữ ký (tùy thuộc vào chuẩn DID bạn dùng)
import did_resolver
import digital_signature_verifier

# Cấu hình (đọc từ environment variables hoặc config file)
INFURA_URL = os.getenv("INFURA_URL") # Hoặc RPC endpoint khác
DIGITAL_TWIN_REGISTRY_CONTRACT_ADDRESS = os.getenv("DIGITAL_TWIN_REGISTRY_CONTRACT_ADDRESS")
LEARN_TWIN_NFT_CONTRACT_ADDRESS = os.getenv("LEARN_TWIN_NFT_CONTRACT_ADDRESS")
DIGITAL_TWIN_REGISTRY_ABI = [...] # ABI của DigitalTwinRegistry.sol
LEARN_TWIN_NFT_ABI = [...] # ABI của LearnTwinNFT.sol
LLM_API_KEY = os.getenv("LLM_API_KEY")
IPFS_HOST = os.getenv("IPFS_HOST", "/dns/localhost/tcp/5001/http")

# Khởi tạo kết nối
w3 = Web3(Web3.HTTPProvider(INFURA_URL))
ipfs_client = ipfshttpclient.connect(IPFS_HOST)
digital_twin_registry_contract = w3.eth.contract(address=DIGITAL_TWIN_REGISTRY_CONTRACT_ADDRESS, abi=DIGITAL_TWIN_REGISTRY_ABI)
learn_twin_nft_contract = w3.eth.contract(address=LEARN_TWIN_NFT_CONTRACT_ADDRESS, abi=LEARN_TWIN_NFT_ABI)

# Lưu trữ twin data (ví dụ: trong một cơ sở dữ liệu tạm thời hoặc kết nối với DB thực tế)
digital_twins_data: Dict[str, DigitalTwin] = {} # Thay thế bằng kết nối DB

def get_digital_twin(twin_id: str) -> Optional[DigitalTwin]:
    """Retrieves the digital twin data for a given twin ID."""
    # Implement logic to retrieve twin data from your storage (e.g., database)
    # Nếu lưu trữ CID trên blockchain, bạn cần truy vấn contract registry để lấy CID mới nhất
    # latest_cid = digital_twin_registry_contract.functions.getLatestTwinCID(twin_id).call()
    # data_from_ipfs = ipfs_client.cat(latest_cid)
    # twin_data = DigitalTwin.parse_raw(data_from_ipfs)
    # return twin_data
    # Tạm thời trả về dữ liệu từ bộ nhớ (thay thế bằng logic DB)
    # return digital_twins_data.get(twin_id)
    pass # Placeholder

def update_digital_twin(update_data: UpdateTwinRequest) -> bool:
    """Updates the digital twin data."""
    # 1. Verify DID signature: Cần triển khai logic xác thực chữ ký DID
    is_signature_valid = digital_signature_verifier.verify(update_data.owner_did, update_data.json(), signature_from_header) # Cần lấy chữ ký từ header request
    if not is_signature_valid:
        return False

    # 2. Retrieve the current twin data
    current_twin = get_digital_twin(update_data.twin_id)
    if current_twin is None:
        # Tạo twin mới nếu chưa tồn tại
        current_twin = DigitalTwin(twin_id=update_data.twin_id, owner_did=update_data.owner_did)

    # 3. Merge the update_data with the current twin data
    if update_data.python_progress_updates:
        current_twin.python_progress.update(update_data.python_progress_updates)
    if update_data.python_skills_updates:
        current_twin.python_skills.update(update_data.python_skills_updates)
    if update_data.learning_behavior_updates:
        # Cập nhật từng trường trong learning_behavior nếu có
        if update_data.learning_behavior_updates.total_study_time is not None:
             current_twin.learning_behavior.total_study_time = update_data.learning_behavior_updates.total_study_time
        # ... cập nhật các trường khác tương tự
        pass # Placeholder

    if update_data.interaction_logs_updates:
        # Cập nhật từng trường trong interaction_logs nếu có
        if update_data.interaction_logs_updates.last_llm_session is not None:
             current_twin.interaction_logs.last_llm_session = update_data.interaction_logs_updates.last_llm_session
        # ... cập nhật các trường khác tương tự
        if update_data.interaction_logs_updates.llm_interaction_history:
             current_twin.interaction_logs.llm_interaction_history.extend(update_data.interaction_logs_updates.llm_interaction_history)
        pass # Placeholder


    # 4. Implement versioning (generate a new IPFS CID)
    twin_data_json = current_twin.json()
    try:
        add_result = ipfs_client.add(twin_data_json)
        new_cid = add_result['Hash']
    except Exception as e:
        print(f"Error adding to IPFS: {e}")
        return False

    # 5. Store the updated twin data (e.g., update in database)
    digital_twins_data[update_data.twin_id] = current_twin # Tạm thời lưu vào bộ nhớ
    pass # Placeholder for saving to DB

    # 6. Optionally, record the new IPFS CID on the blockchain
    try:
    #     # Cần có tài khoản Ethereum đã unlock để gửi transaction
        account = w3.eth.accounts[0] # Hoặc tài khoản đã cấu hình
        tx_hash = digital_twin_registry_contract.functions.updateTwinCID(
            update_data.twin_id, new_cid
        ).transact({'from': account})
        w3.eth.wait_for_transaction_receipt(tx_hash)
        print(f"Twin CID updated on blockchain: {tx_hash.hex()}")
    except Exception as e:
        print(f"Error updating twin CID on blockchain: {e}")
        # Quyết định xem có rollback việc lưu trên IPFS/DB hay không
        return False

    return True # Placeholder

def process_quiz_result(quiz_result: QuizResult) -> bool:
    """Processes a quiz result and updates the digital twin."""
    twin = get_digital_twin(quiz_result.twin_id)
    if twin is None:
        return False

    # Cập nhật tiến độ học tập dựa trên kết quả quiz
    module_progress = twin.python_progress.get(quiz_result.module, PythonProgress(topic=quiz_result.module))
    module_progress.understanding_level = (module_progress.understanding_level + quiz_result.score) / 2 # Ví dụ đơn giản
    module_progress.last_accessed = datetime.now()
    if quiz_result.score == 1.0:
        module_progress.completion_status = "completed"
    elif module_progress.completion_status == "not_started":
        module_progress.completion_status = "in_progress"

    twin.python_progress[quiz_result.module] = module_progress

    # Cập nhật tỷ lệ đúng quiz trong hành vi học tập
    twin.learning_behavior.quiz_accuracy[quiz_result.quiz_id] = quiz_result.score

    # Lưu lại kết quả quiz (có thể lưu vào một collection riêng trong DB)
    save_quiz_result(quiz_result)

    # Cập nhật twin
    update_twin_request = UpdateTwinRequest(
        twin_id=twin.twin_id,
        owner_did=twin.owner_did,
        python_progress_updates={quiz_result.module: module_progress},
        learning_behavior_updates=twin.learning_behavior # Cập nhật toàn bộ behavior để đơn giản
    )
    return update_digital_twin(update_twin_request)

def query_llm_agent(query: LLMQuery) -> LLMResponse:
    """Sends a query to the LLM agent and gets a response."""
    twin = get_digital_twin(query.twin_id)
    if twin is None:
        return LLMResponse(response="Error: Digital twin not found.")

    # Format the prompt for the LLM, including relevant twin data
    # Dựa vào twin data để cá nhân hóa câu trả lời và gợi ý
    prompt = f"User DID: {twin.owner_did}\n"
    prompt += f"Current Python progress: {twin.python_progress}\n"
    prompt += f"User query: {query.prompt}\n"
    prompt += "Based on the user's progress and query, provide a helpful response and suggest next steps in learning Python."

    # Send the prompt to the LLM API (Ví dụ: OpenAI)
    # try:
    #     response = requests.post(
    #         "https://api.openai.com/v1/chat/completions", # Hoặc endpoint của mô hình khác
    #         headers={"Authorization": f"Bearer {LLM_API_KEY}"},
    #         json={"model": "gpt-4", "messages": [{"role": "user", "content": prompt}]} # Hoặc cấu trúc cho mô hình khác
    #     )
    #     response.raise_for_status()
    #     llm_output = response.json()['choices'][0]['message']['content']
    # except Exception as e:
    #     print(f"Error calling LLM API: {e}")
    #     return LLMResponse(response="Error communicating with LLM agent.")

    # Process the LLM's response (cần phân tích output của LLM để lấy gợi ý)
    # Đây là phần phức tạp, có thể dùng LangChain hoặc xử lý chuỗi đơn giản
    # suggested_next_steps = extract_suggestions_from_llm_output(llm_output) # Cần triển khai hàm này

    # Log the interaction in the user's twin data
    # new_interaction = LLMInteraction(
    #     timestamp=datetime.now(),
    #     user_query=query.prompt,
    #     llm_response=llm_output,
    #     topics_discussed=extract_topics_from_interaction(query.prompt, llm_output) # Cần triển khai hàm này
    # )
    # twin.interaction_logs.llm_interaction_history.append(new_interaction)
    # twin.interaction_logs.last_llm_session = datetime.now()
    # update_twin_request = UpdateTwinRequest(
    #      twin_id=twin.twin_id,
    #      owner_did=twin.owner_did,
    #      interaction_logs_updates=twin.interaction_logs
    # )
    # update_digital_twin(update_twin_request)


    # Tạm thời trả về response giả
    llm_output = "Đây là phản hồi từ LLM agent giả lập. Bạn hỏi về Python."
    suggested_next_steps = ["Xem lại biến và kiểu dữ liệu", "Làm bài tập về vòng lặp"]

    return LLMResponse(response=llm_output, suggested_next_steps=suggested_next_steps) # Placeholder

def mint_skill_nft(mint_request: NFTMintRequest) -> NFTMintResponse:
    """Mints a skill NFT for the learner."""
    # 1. Tạo NFT metadata và upload lên IPFS
    # nft_metadata = NFTMetadata(
    #     name=f"Python Skill: {mint_request.module}",
    #     description=f"Chứng nhận hoàn thành module {mint_request.module} Python.",
    #     image="IPFS_LINK_TO_NFT_IMAGE", # Cần có hình ảnh cho NFT
    #     attributes=[{"trait_type": "Module", "value": mint_request.module}]
    # )
    # try:
    #     metadata_json = nft_metadata.json()
    #     metadata_add_result = ipfs_client.add(metadata_json)
    #     skill_token_uri = f"ipfs://{metadata_add_result['Hash']}"
    # except Exception as e:
    #     print(f"Error uploading NFT metadata to IPFS: {e}")
    #     return NFTMintResponse(success=False, message="Failed to upload NFT metadata.")

    # 2. Interact with the LearnTwinNFT smart contract to mint a new NFT
    # try:
    #     # Cần có tài khoản Ethereum đã unlock để gửi transaction
    #     account = w3.eth.accounts[0] # Hoặc tài khoản đã cấu hình
    #     # Cần map twin_id (DID) sang địa chỉ Ethereum của người nhận
    #     recipient_address = resolve_did_to_ethereum_address(mint_request.twin_id) # Cần triển khai hàm này
    #     tx_hash = learn_twin_nft_contract.functions.mintNFT(
    #         recipient_address, skill_token_uri
    #     ).transact({'from': account})
    #     receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    #
    #     # Extract token ID from transaction receipt (tùy thuộc vào event trong smart contract)
    #     token_id = None
    #     # for event in learn_twin_nft_contract.events.Transfer().processReceipt(receipt):
    #     #     token_id = event['args']['tokenId']
    #
    #     # Cập nhật twin data với thông tin NFT
    #     twin = get_digital_twin(mint_request.twin_id)
    #     if twin:
    #         for checkpoint in twin.learning_state.checkpoint_history:
    #             if checkpoint.module == mint_request.module and not checkpoint.tokenized:
    #                 checkpoint.tokenized = True
    #                 checkpoint.nft_cid = skill_token_uri # Lưu CID hoặc URI
    #                 update_twin_request = UpdateTwinRequest(
    #                     twin_id=twin.twin_id,
    #                     owner_did=twin.owner_did,
    #                     learning_state_updates=twin.learning_state
    #                 )
    #                 update_digital_twin(update_twin_request)
    #                 break
    #
    #     return NFTMintResponse(success=True, transaction_hash=tx_hash.hex(), token_id=token_id)
    # except Exception as e:
    #     print(f"Error minting NFT: {e}")
    #     return NFTMintResponse(success=False, message="Failed to mint NFT.")
    pass # Placeholder

def verify_digital_twin_data(verifier_request: VerifierRequest) -> VerifierResponse:
    """Verifies the integrity, authenticity, and provenance of digital twin data."""
    integrity_checked = False
    authenticity_checked = False
    provenance_checked = False
    message = "Verification failed."

    # 1. Integrity Check: Retrieve data from IPFS using the provided CID and compare its hash with the CID.
    # try:
    #     data_from_ipfs = ipfs_client.cat(verifier_request.cid)
    #     # So sánh hash của data_from_ipfs với verifier_request.cid
    #     # Cần triển khai hàm tính hash của data
    #     # if calculate_hash(data_from_ipfs) == verifier_request.cid:
    #     integrity_checked = True
    # except Exception as e:
    #     print(f"Error retrieving data from IPFS or integrity check failed: {e}")


    # 2. Authenticity Check: Verify the signature from verifier_request.signature using the owner_did against the retrieved data.
    # if integrity_checked: # Chỉ kiểm tra authenticity nếu integrity pass
    #     try:
    #          # Cần triển khai logic xác thực chữ ký DID
    #          # is_signature_valid = digital_signature_verifier.verify(verifier_request.owner_did, data_from_ipfs.decode('utf-8'), verifier_request.signature)
    #          # authenticity_checked = is_signature_valid
    #         pass # Placeholder
    #     except Exception as e:
    #         print(f"Authenticity check failed: {e}")


    # 3. Provenance Check: Check the blockchain for a record matching the twin_id, CID, and timestamp.
    # if authenticity_checked: # Chỉ kiểm tra provenance nếu authenticity pass
    #     try:
    #         # Truy vấn DigitalTwinRegistry contract
    #         # record_exists = digital_twin_registry_contract.functions.checkTwinRecord(
    #         #     verifier_request.twin_id, verifier_request.cid, int(verifier_request.timestamp.timestamp())
    #         # ).call()
    #         # provenance_checked = record_exists
    #         pass # Placeholder
    #     except Exception as e:
    #         print(f"Provenance check failed: {e}")


    is_valid = integrity_checked and authenticity_checked and provenance_checked

    if is_valid:
        message = "Digital twin data verified successfully."
    else:
        message = "Digital twin data verification failed."
        if not integrity_checked:
            message += " Integrity check failed."
        if not authenticity_checked:
            message += " Authenticity check failed."
        if not provenance_checked:
            message += " Provenance check failed."


    return VerifierResponse(
        is_valid=is_valid,
        integrity_checked=integrity_checked,
        authenticity_checked=authenticity_checked,
        provenance_checked=provenance_checked,
        message=message
    )
    pass # Placeholder

# Hàm giả lập để trích xuất gợi ý từ LLM output
def extract_suggestions_from_llm_output(llm_output: str) -> List[str]:
    """Parses LLM output to extract suggested next steps."""
    # This is a placeholder - needs actual parsing logic
    return ["Gợi ý 1", "Gợi ý 2"]

# Hàm giả lập để trích xuất chủ đề từ tương tác LLM
def extract_topics_from_interaction(user_query: str, llm_response: str) -> List[str]:
     """Extracts topics discussed in an LLM interaction."""
     # This is a placeholder - needs actual topic extraction logic
     return ["Chủ đề"]

# Hàm giả lập để ánh xạ DID sang địa chỉ Ethereum
def resolve_did_to_ethereum_address(did: str) -> str:
    """Resolves a DID to an Ethereum address."""
    # Cần tích hợp với hệ thống DID resolver
    # Ví dụ đơn giản:
    # if did == "did:learntwin:student001":
    #     return "0xAbC123..." # Địa chỉ Ethereum tương ứng
    pass # Placeholder
