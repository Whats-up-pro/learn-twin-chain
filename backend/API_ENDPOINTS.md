# LearnTwinChain API Endpoints

## Base URL
```
http://localhost:8000
```

## Authentication & User Management

### 1. User Registration
```http
POST /register
Content-Type: application/json

{
  "did": "did:learntwin:student001",
  "name": "Nguyen Van A",
  "password": "password123",
  "role": "student",  // "student", "teacher", "employer"
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**Note:** Digital Twin files are only created for users with role "student". Teachers and employers do not have digital twin files.

### 2. User Login
```http
POST /login
Content-Type: application/json

{
  "did": "did:learntwin:student001",
  "password": "password123"
}
```

### 3. Health Check
```http
GET /health
```

## Digital Twin Management (Students Only)

**Important:** Digital Twin functionality is only available for students. Teachers and employers can view student data but do not have their own digital twins.

### 4. Get All Students (for Teacher/Employer Dashboard)
```http
GET /api/v1/learning/students
```

**Response:** Returns only users with role "student" and their digital twin data.

### 5. Get Student Twin by ID
```http
GET /api/v1/learning/students/{twin_id}
```

### 6. Create Student Twin
```http
POST /api/v1/learning/students
Content-Type: application/json

{
  "twin_id": "did:learntwin:student001",
  "config": {...},
  "profile": {...}
}
```

### 7. Update Digital Twin
```http
POST /api/v1/update-twin
Content-Type: application/json

{
  "twin_id": "did:learntwin:student001",
  "updates": {...}
}
```

### 8. Complete Module & Pin to IPFS
```http
POST /api/v1/twins/{twin_id}/complete-module
Content-Type: application/json

{
  "module_name": "Python Programming",
  "completed_at": "2024-01-15T10:30:00+07:00",
  "tokenized": false,
  "nft_cid": null
}
```

### 9. Create Twin
```http
POST /api/v1/twins
Content-Type: application/json

{
  "twin_id": "did:learntwin:student001",
  "config": {...}
}
```

### 10. Get Twin
```http
GET /api/v1/twins/{twin_id}
```

### 11. Get Twin State
```http
GET /api/v1/twins/{twin_id}/state
```

### 12. Update Twin State
```http
POST /api/v1/twins/{twin_id}/state
Content-Type: application/json

{
  "properties": {...},
  "metadata": {...}
}
```

### 13. Get Twin History
```http
GET /api/v1/twins/{twin_id}/history?limit=10
```

### 14. Record Twin Event
```http
POST /api/v1/twins/{twin_id}/events
Content-Type: application/json

{
  "event_type": "module_completed",
  "data": {...},
  "blockchain_tx_hash": "0x123..."
}
```

## NFT & Blockchain Integration (Students Only)

### 15. Mint NFT for Skill Achievement
```http
POST /api/v1/learning/skills/verify-and-mint
Content-Type: application/json

{
  "student_did": "did:learntwin:student001",
  "student_address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "skill": "Python Programming",
  "metadata": {
    "verification_date": "2024-01-15",
    "score": 95,
    "instructor": "Dr. Smith"
  }
}
```

### 16. Demo Mint NFT (No Blockchain)
```http
POST /api/v1/learning/skills/verify-and-mint-demo
Content-Type: application/json

{
  "student_did": "did:learntwin:student001",
  "skill": "JavaScript Programming",
  "metadata": {
    "verification_date": "2024-01-16",
    "score": 88
  }
}
```

### 17. Update DID Data
```http
POST /api/v1/learning/did/update
Content-Type: application/json

{
  "student_did": "did:learntwin:student001",
  "student_address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  "skill": "Python Programming",
  "token_id": "0x1234567890abcdef",
  "cid_nft": "QmTestNFT123456"
}
```

## Analytics & Insights (Students Only)

### 18. Analyze Learning Data
```http
POST /api/v1/analytics/learning
Content-Type: application/json

{
  "progress_data": [...]
}
```

### 19. Get Learning Analytics
```http
GET /api/v1/analytics/learning/{student_id}
```

### 20. Get Behavior Analytics
```http
GET /api/v1/analytics/behavior/{student_id}
```

### 21. Get Prediction Models
```http
GET /api/v1/analytics/predictions/{student_id}
```

## Teacher & Employer Features

### 22. Add Teacher Feedback
```http
POST /api/v1/feedback
Content-Type: application/json

{
  "student_did": "did:learntwin:student001",
  "teacher_id": "did:learntwin:teacher001",
  "content": "Excellent work on Python programming!",
  "score": 95.0,
  "created_at": "2024-01-15T10:30:00+07:00"
}
```

### 23. Sync Users and Twins
```http
POST /api/v1/sync-users-twins
```

## IPFS Integration

### 24. Upload JSON to IPFS
```http
POST /api/v1/ipfs/upload
Content-Type: application/json

{
  "data": {...},
  "name": "document_name"
}
```

### 25. Get IPFS File URL
```http
GET /api/v1/ipfs/url/{cid}
```

### 26. Download JSON from IPFS
```http
GET /api/v1/ipfs/download/{cid}
```

## Response Formats

### Success Response
```json
{
  "status": "success",
  "message": "Operation completed successfully",
  "data": {...}
}
```

### Error Response
```json
{
  "detail": "Error message description"
}
```

## NFT Response Format
```json
{
  "status": "success",
  "message": "Skill Python Programming verified and NFT minted successfully",
  "vc": {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "type": ["VerifiableCredential"],
    "issuer": "did:learntwin:school001",
    "credentialSubject": {
      "id": "did:learntwin:student001",
      "skill": "Python Programming"
    },
    "proof": {...}
  },
  "cid_nft": "QmTestNFT123456",
  "token_id": "0x1234567890abcdef",
  "nft_metadata": {
    "name": "Skill Achievement: Python Programming",
    "description": "Verified credential for skill: Python Programming",
    "attributes": [...]
  }
}
```

## DID Document Format
```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/ed25519-2018/v1"
  ],
  "id": "did:learntwin:student001",
  "controller": "did:learntwin:student001",
  "verificationMethod": [...],
  "service": [...],
  "alsoKnownAs": ["0x70997970C51812dc3A010C7d01b50e0d17dc79C8"],
  "metadata": {
    "created": "2024-01-01T00:00:00Z",
    "updated": "2024-01-15T00:00:00Z",
    "version": 2
  },
  "nft_credentials": {
    "skill": "Python Programming",
    "token_id": "0x1234567890abcdef",
    "cid_nft": "QmTestNFT123456",
    "blockchain_address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "issuer": "did:learntwin:school001",
    "issued_at": "2024-01-15T00:00:00Z"
  }
}
```

## Usage Examples for UI

### Student Dashboard Flow
1. **Login** → `POST /login`
2. **Get student data** → `GET /api/v1/learning/students/{did}`
3. **View learning progress** → `GET /api/v1/twins/{did}/state`
4. **Complete modules** → `POST /api/v1/twins/{did}/complete-module`
5. **View NFT achievements** → Check `NFT_list` in student data
6. **View history** → `GET /api/v1/twins/{did}/history`

### Teacher Dashboard Flow
1. **Get all students** → `GET /api/v1/learning/students`
2. **View individual student progress** → `GET /api/v1/learning/students/{did}`
3. **Add feedback** → `POST /api/v1/feedback`
4. **Mint NFTs for achievements** → `POST /api/v1/learning/skills/verify-and-mint`
5. **View analytics** → `POST /api/v1/analytics/learning`

### Employer Dashboard Flow
1. **Get all students** → `GET /api/v1/learning/students`
2. **View student skills and NFTs** → Check `NFT_list` in student data
3. **Verify credentials via blockchain** → Use `token_id` and `cid_nft`
4. **View DID documents** → Check `did_document` in student data

### Admin/System Flow
1. **Sync data** → `POST /api/v1/sync-users-twins`
2. **Update DID data** → `POST /api/v1/learning/did/update`
3. **Monitor analytics** → `GET /api/v1/analytics/*`
4. **Upload to IPFS** → `POST /api/v1/ipfs/upload`

## Frontend Integration Examples

### React/TypeScript Service
```typescript
// digitalTwinService.ts
export const loginUser = async (did: string, password: string) => {
  const response = await fetch('http://localhost:8000/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ did, password })
  });
  return response.json();
};

export const getStudentData = async (did: string) => {
  const response = await fetch(`http://localhost:8000/api/v1/learning/students/${did}`);
  return response.json();
};

export const mintNFT = async (studentDid: string, studentAddress: string, skill: string, metadata: any) => {
  const response = await fetch('http://localhost:8000/api/v1/learning/skills/verify-and-mint', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_did: studentDid, student_address: studentAddress, skill, metadata })
  });
  return response.json();
};
```

### JavaScript Service
```javascript
// studentService.js
export async function getAllStudents() {
  const res = await fetch('http://localhost:8000/api/v1/learning/students');
  if (!res.ok) throw new Error('Failed to fetch students');
  return res.json();
}

export async function completeModule(twinId, moduleData) {
  const res = await fetch(`http://localhost:8000/api/v1/twins/${twinId}/complete-module`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(moduleData)
  });
  if (!res.ok) throw new Error('Failed to complete module');
  return res.json();
}
```

## Error Handling

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `409` - Conflict (User already exists)
- `422` - Validation Error
- `500` - Internal Server Error

### Error Response Format
```json
{
  "detail": "Specific error message",
  "status_code": 400,
  "timestamp": "2024-01-15T10:30:00+07:00"
}
```

## Testing Endpoints

### Test NFT Minting (Demo)
```bash
curl -X POST http://localhost:8000/api/v1/learning/skills/verify-and-mint-demo \
  -H "Content-Type: application/json" \
  -d '{
    "student_did": "did:learntwin:student001",
    "skill": "Python Programming",
    "metadata": {
      "verification_date": "2024-01-15",
      "score": 95
    }
  }'
```

### Test Complete Module
```bash
curl -X POST http://localhost:8000/api/v1/twins/did:learntwin:student001/complete-module \
  -H "Content-Type: application/json" \
  -d '{
    "module_name": "Python Programming",
    "completed_at": "2024-01-15T10:30:00+07:00",
    "tokenized": false,
    "nft_cid": null
  }'
``` 