# Decentralized Data Architecture for Learning Platform

## 🏗️ **Kiến trúc lưu trữ data mới:**

### **1. 📊 Data Storage Layers:**

```
┌─────────────────────────────────────────────────────────────┐
│                    DECENTRALIZED STORAGE                    │
├─────────────────────────────────────────────────────────────┤
│  🌐 IPFS Layer (Public Data)                               │
│  ├── Learning Content (Courses, Modules)                   │
│  ├── Digital Twin Profiles                                 │
│  ├── Learning Evidence                                     │
│  └── NFT Metadata                                          │
├─────────────────────────────────────────────────────────────┤
│  ⛓️  Blockchain Layer (Verification Data)                  │
│  ├── Learning Sessions (LearningDataRegistry)             │
│  ├── NFT Ownership (ModuleProgressNFT)                     │
│  ├── Achievement Records (LearningAchievementNFT)          │
│  └── Verification Proofs                                   │
├─────────────────────────────────────────────────────────────┤
│  🗄️  Local Cache Layer (Performance)                       │
│  ├── User Sessions                                         │
│  ├── Real-time Analytics                                   │
│  └── Temporary Data                                        │
└─────────────────────────────────────────────────────────────┘
```

### **2. 📁 Cấu trúc data mới:**

#### **A. User Data Structure:**
```json
{
  "did": "did:learntwin:student001",
  "profile": {
    "name": "Đoàn Minh Trung",
    "email": "trung@uit.edu.vn",
    "institution": "UIT",
    "program": "Computer Science",
    "student_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
  },
  "storage": {
    "profile_cid": "QmProfileHash",           // IPFS
    "learning_data_cid": "QmLearningHash",    // IPFS
    "blockchain_sessions": ["session_hash1"]   // Blockchain
  },
  "privacy": {
    "public_fields": ["name", "institution"],
    "private_fields": ["email", "birth_year"],
    "encrypted_fields": ["medical_info"]
  }
}
```

#### **B. Digital Twin Data Structure:**
```json
{
  "twin_id": "did:learntwin:student001",
  "storage": {
    "profile_cid": "QmTwinProfileHash",       // IPFS
    "learning_state_cid": "QmStateHash",      // IPFS
    "interaction_logs_cid": "QmLogsHash",     // IPFS
    "blockchain_verification": "session_hash" // Blockchain
  },
  "data_types": {
    "public": {
      "skills": ["Python", "OOP"],
      "achievements": ["NFT_1", "NFT_2"]
    },
    "private": {
      "learning_patterns": "encrypted_data",
      "personal_notes": "encrypted_data"
    }
  }
}
```

#### **C. Course/Module Data Structure:**
```json
{
  "module_id": "python_basics_001",
  "storage": {
    "content_cid": "QmModuleContentHash",     // IPFS
    "metadata_cid": "QmModuleMetadataHash",   // IPFS
    "blockchain_registry": "module_hash"      // Blockchain
  },
  "content": {
    "lessons": ["lesson_1_cid", "lesson_2_cid"],
    "exercises": ["exercise_1_cid", "exercise_2_cid"],
    "assessments": ["quiz_1_cid", "quiz_2_cid"]
  }
}
```

### **3. 🔄 Data Flow:**

#### **A. Learning Session Flow:**
```
1. Student learns → Learning data generated
2. Data stored on IPFS → Get CID
3. CID + metadata → LearningDataRegistry (Blockchain)
4. Validators verify → Session approved
5. Student creates ZK proof → Mint NFT
```

#### **B. Digital Twin Update Flow:**
```
1. Learning activity → Update learning state
2. New state → IPFS storage → New CID
3. CID + timestamp → Blockchain verification
4. Digital twin updated → Real-time sync
```

### **4. 🗄️ Implementation Plan:**

#### **Phase 1: IPFS Integration**
```python
class DecentralizedDataService:
    def __init__(self):
        self.ipfs_service = IPFSService()
        self.blockchain_service = BlockchainService()
    
    def store_user_profile(self, user_data):
        # Store on IPFS
        cid = self.ipfs_service.upload_json(user_data)
        
        # Store CID reference on blockchain
        self.blockchain_service.store_user_reference(user_did, cid)
        
        return cid
    
    def store_digital_twin(self, twin_data):
        # Store on IPFS
        cid = self.ipfs_service.upload_json(twin_data)
        
        # Update blockchain reference
        self.blockchain_service.update_twin_reference(twin_id, cid)
        
        return cid
```

#### **Phase 2: Blockchain Verification**
```solidity
contract DataRegistry {
    mapping(bytes32 => string) public dataReferences; // hash -> IPFS CID
    mapping(address => bytes32[]) public userDataHashes;
    
    function storeDataReference(
        bytes32 dataHash,
        string memory ipfsCID
    ) external {
        dataReferences[dataHash] = ipfsCID;
        userDataHashes[msg.sender].push(dataHash);
    }
}
```

#### **Phase 3: Real-time Sync**
```python
class DataSyncService:
    def __init__(self):
        self.ipfs_service = IPFSService()
        self.blockchain_service = BlockchainService()
        self.cache_service = CacheService()
    
    def sync_user_data(self, user_did):
        # Get latest CIDs from blockchain
        cids = self.blockchain_service.get_user_data_cids(user_did)
        
        # Fetch latest data from IPFS
        for cid in cids:
            data = self.ipfs_service.get_json(cid)
            self.cache_service.update_cache(user_did, data)
        
        return "Data synced successfully"
```

### **5. 🔒 Privacy & Security:**

#### **A. Data Encryption:**
```python
class PrivacyService:
    def __init__(self):
        self.encryption_key = os.getenv('ENCRYPTION_KEY')
    
    def encrypt_private_data(self, data):
        # Encrypt sensitive data before IPFS storage
        encrypted_data = self.encrypt(data, self.encryption_key)
        return encrypted_data
    
    def decrypt_private_data(self, encrypted_data):
        # Decrypt data for authorized access
        decrypted_data = self.decrypt(encrypted_data, self.encryption_key)
        return decrypted_data
```

#### **B. Access Control:**
```python
class AccessControlService:
    def check_data_access(self, user_did, data_cid, requester_did):
        # Check if requester has permission to access data
        permissions = self.get_user_permissions(user_did)
        
        if self.has_permission(requester_did, permissions, data_cid):
            return self.get_data(data_cid)
        else:
            raise AccessDeniedError("Insufficient permissions")
```

### **6. 📊 Migration Strategy:**

#### **Step 1: Data Analysis**
```python
def analyze_current_data():
    # Analyze existing data structure
    users = load_json("backend/data/users/users.json")
    digital_twins = load_digital_twins("backend/data/digital_twins/")
    
    # Identify data types and privacy levels
    data_mapping = {
        "public": ["name", "institution", "skills"],
        "private": ["email", "birth_year", "learning_patterns"],
        "sensitive": ["medical_info", "financial_data"]
    }
    
    return data_mapping
```

#### **Step 2: Data Migration**
```python
def migrate_to_decentralized():
    # 1. Upload existing data to IPFS
    for user in users:
        cid = ipfs_service.upload_json(user)
        blockchain_service.store_user_reference(user["did"], cid)
    
    # 2. Update data references
    for twin in digital_twins:
        cid = ipfs_service.upload_json(twin)
        blockchain_service.store_twin_reference(twin["twin_id"], cid)
    
    # 3. Verify migration
    verify_migration_success()
```

#### **Step 3: Service Updates**
```python
def update_services():
    # Update all services to use decentralized storage
    services = [
        "UserService",
        "DigitalTwinService", 
        "LearningService",
        "NFTService"
    ]
    
    for service in services:
        update_service_to_use_decentralized_storage(service)
```

### **7. 🎯 Benefits:**

#### **✅ Decentralization:**
- No single point of failure
- Data ownership by users
- Censorship resistance

#### **✅ Scalability:**
- IPFS handles large data
- Blockchain for verification
- Local cache for performance

#### **✅ Privacy:**
- Encrypted private data
- User-controlled access
- Zero-knowledge proofs

#### **✅ Interoperability:**
- Standard data formats
- Cross-platform compatibility
- Open protocols

### **8. 📋 Implementation Timeline:**

#### **Week 1-2: Setup & Analysis**
- [ ] Set up IPFS node
- [ ] Analyze current data structure
- [ ] Design new data schema

#### **Week 3-4: Core Services**
- [ ] Implement DecentralizedDataService
- [ ] Create DataRegistry contract
- [ ] Build migration scripts

#### **Week 5-6: Integration**
- [ ] Update existing services
- [ ] Implement data sync
- [ ] Add privacy controls

#### **Week 7-8: Testing & Deployment**
- [ ] Test data migration
- [ ] Performance optimization
- [ ] Deploy to production

### **9. 🔧 Tools & Technologies:**

#### **Storage:**
- **IPFS**: Decentralized file storage
- **Ethereum**: Blockchain verification
- **Redis**: Local caching

#### **Privacy:**
- **AES-256**: Data encryption
- **JWT**: Access tokens
- **ZK Proofs**: Privacy-preserving verification

#### **Monitoring:**
- **IPFS Cluster**: Data availability
- **Etherscan**: Blockchain monitoring
- **Grafana**: Performance metrics 