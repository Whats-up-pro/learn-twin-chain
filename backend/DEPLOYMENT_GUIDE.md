# 🚀 LearnTwinChain Smart Contract Deployment Guide

## 📋 Prerequisites

1. **Hardhat Node đang chạy**
2. **OpenZeppelin contracts đã cài đặt**
3. **Python dependencies đã cài đặt**

## 🔧 Các bước thực hiện

### 1. Khởi động Hardhat Node

```bash
cd backend
npx hardhat node
```

Kết quả sẽ hiển thị:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

...
```

### 2. Chọn địa chỉ Deployer

Trong terminal mới, chạy:

```bash
cd backend
python select_deployer.py
```

Script sẽ:
- Kết nối với Hardhat node
- Hiển thị danh sách 10 accounts đầu tiên
- Cho phép bạn chọn account để deploy
- Tự động cập nhật `config.env` với private key

### 3. Deploy Contracts

Sau khi chọn account, chạy:

```bash
python deploy_contracts.py
```

## 📁 Files được tạo

### Input Files:
- `contracts/ModuleProgressNFT.sol` - ERC-1155 NFT cho module progress
- `contracts/LearningAchievementNFT.sol` - ERC-721 NFT cho achievements
- `contracts/DigitalTwinRegistry.sol` - Registry contract
- `contracts/LearnTwinNFT.sol` - Legacy NFT contract
- `config.env` - Configuration với private key

### Output Files:
- `deployment_addresses.json` - Địa chỉ tất cả contracts
- `deployment.env` - Template environment variables
- `contracts/abi/` - ABI files cho từng contract

## 🔍 Troubleshooting

### Lỗi "insufficient funds"
- **Nguyên nhân**: Account không có đủ ETH
- **Giải pháp**: Sử dụng Hardhat node (mỗi account có 10,000 ETH)

### Lỗi "OpenZeppelin contracts not found"
- **Nguyên nhân**: Chưa cài đặt OpenZeppelin
- **Giải pháp**: `npm install @openzeppelin/contracts`

### Lỗi "Could not connect to Hardhat node"
- **Nguyên nhân**: Hardhat node chưa chạy
- **Giải pháp**: Chạy `npx hardhat node` trước

### Lỗi "solcx not installed"
- **Nguyên nhân**: Python Solidity compiler chưa cài
- **Giải pháp**: `pip install solcx`

## 📊 Deployment Results

Sau khi deploy thành công, bạn sẽ thấy:

```
🎉 All contracts deployed successfully!

📋 Deployment Summary:
  MODULE_PROGRESS_CONTRACT_ADDRESS: 0x5FbDB2315678afecb367f032d93F642f64180aa3
  ACHIEVEMENT_CONTRACT_ADDRESS: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
  REGISTRY_CONTRACT_ADDRESS: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
  LEGACY_NFT_CONTRACT_ADDRESS: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
```

## 🔗 Next Steps

1. **Cập nhật environment variables** với địa chỉ contracts
2. **Test contracts** bằng Hardhat console
3. **Integrate với frontend** sử dụng Web3.js/ethers.js
4. **Deploy lên testnet** (Sepolia, Goerli) khi sẵn sàng

## 💡 Tips

- **Luôn backup** `deployment_addresses.json`
- **Test kỹ** trên local trước khi deploy testnet
- **Sử dụng Hardhat console** để tương tác với contracts
- **Monitor gas usage** để optimize contracts 