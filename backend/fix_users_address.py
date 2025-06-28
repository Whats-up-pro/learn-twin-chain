#!/usr/bin/env python3
"""
Script để thêm address cho tất cả users hiện có chưa có address
"""

import json
import os

def fix_users_address():
    """Cập nhật tất cả users với address"""
    
    # Đường dẫn file users
    users_file = os.path.join('data', 'users', 'users.json')
    
    # Hardhat test accounts
    hardhat_accounts = [
        "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", 
        "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
        "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
        "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
        "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
        "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
        "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720"
    ]
    
    # Đọc users hiện tại
    if not os.path.exists(users_file):
        print("❌ Users file not found!")
        return
    
    with open(users_file, 'r', encoding='utf-8') as f:
        users = json.load(f)
    
    print(f"�� Found {len(users)} users")
    
    # Đếm users chưa có address
    users_without_address = [u for u in users if 'address' not in u or not u['address']]
    print(f"⚠️  Found {len(users_without_address)} users without address")
    
    # Cập nhật từng user chưa có address
    updated_count = 0
    for i, user in enumerate(users):
        if 'address' not in user or not user['address']:
            # Gán address từ danh sách Hardhat
            if i < len(hardhat_accounts):
                user['address'] = hardhat_accounts[i]
                print(f"✅ User {user['name']} ({user['did']}) -> {user['address']}")
                updated_count += 1
            else:
                # Tạo address ngẫu nhiên nếu hết Hardhat accounts
                import secrets
                user['address'] = f"0x{secrets.token_hex(20)}"
                print(f"✅ User {user['name']} ({user['did']}) -> {user['address']} (random)")
                updated_count += 1
        else:
            print(f"ℹ️  User {user['name']} already has address: {user['address']}")
    
    # Lưu lại file
    with open(users_file, 'w', encoding='utf-8') as f:
        json.dump(users, f, ensure_ascii=False, indent=2)
    
    print(f"\n🎉 Updated {updated_count} users with addresses")
    print(f"📝 Saved to: {users_file}")

if __name__ == "__main__":
    fix_users_address()