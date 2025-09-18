#!/usr/bin/env python3
"""
Simple MongoDB Connection Test
Tests basic network connectivity to MongoDB Atlas
"""

import socket
import sys
from datetime import datetime

def test_mongodb_atlas_connectivity():
    """Test basic connectivity to MongoDB Atlas cluster"""
    print("=" * 60)
    print("MongoDB Atlas Connectivity Test")
    print("=" * 60)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Your MongoDB Atlas cluster hostnames
    cluster_hosts = [
        "ac-rnxuv6q-shard-00-00.f6gxr5y.mongodb.net",
        "ac-rnxuv6q-shard-00-01.f6gxr5y.mongodb.net", 
        "ac-rnxuv6q-shard-00-02.f6gxr5y.mongodb.net"
    ]
    
    print("Testing connectivity to MongoDB Atlas cluster hosts...")
    print()
    
    all_accessible = True
    
    for hostname in cluster_hosts:
        print(f"Testing {hostname}...")
        
        # Test DNS resolution
        try:
            ip_addresses = socket.gethostbyname_ex(hostname)
            print(f"  ✅ DNS Resolution: {ip_addresses[2]}")
        except socket.gaierror as e:
            print(f"  ❌ DNS Resolution failed: {e}")
            all_accessible = False
            continue
        
        # Test port 27017 connectivity
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(10)  # 10 second timeout
            result = sock.connect_ex((hostname, 27017))
            sock.close()
            
            if result == 0:
                print(f"  ✅ Port 27017 accessible")
            else:
                print(f"  ❌ Port 27017 not accessible (Error code: {result})")
                all_accessible = False
                
        except Exception as e:
            print(f"  ❌ Connection test failed: {e}")
            all_accessible = False
        
        print()
    
    # Summary
    print("=" * 60)
    print("CONNECTIVITY TEST SUMMARY")
    print("=" * 60)
    
    if all_accessible:
        print("✅ All cluster hosts are accessible!")
        print("The issue might be:")
        print("  - Authentication credentials")
        print("  - Database permissions")
        print("  - Connection string format")
    else:
        print("❌ Some cluster hosts are not accessible!")
        print()
        print("This indicates a network connectivity issue:")
        print("1. 🔥 FIREWALL: Your firewall is blocking MongoDB connections")
        print("2. 🌐 IP WHITELIST: Your IP address is not whitelisted in MongoDB Atlas")
        print("3. 🚫 NETWORK: Your network/ISP is blocking MongoDB ports")
        print()
        print("SOLUTIONS:")
        print("1. Check your Windows Firewall settings")
        print("2. Add your IP address to MongoDB Atlas Network Access")
        print("3. Try connecting from a different network")
        print("4. Contact your network administrator")
    
    return all_accessible

def get_current_ip():
    """Get current public IP address"""
    try:
        import urllib.request
        with urllib.request.urlopen('https://api.ipify.org', timeout=10) as response:
            ip = response.read().decode('utf-8')
            return ip
    except:
        return "Could not determine"

if __name__ == "__main__":
    print("Starting MongoDB Atlas connectivity test...")
    print()
    
    # Get current IP
    current_ip = get_current_ip()
    print(f"Your current public IP: {current_ip}")
    print()
    
    # Test connectivity
    test_mongodb_atlas_connectivity()
    
    print()
    print("=" * 60)
    print("NEXT STEPS")
    print("=" * 60)
    print("1. Go to MongoDB Atlas Dashboard")
    print("2. Navigate to Network Access")
    print(f"3. Add IP Address: {current_ip}")
    print("4. Or add 0.0.0.0/0 for all IPs (less secure)")
    print("5. Wait 1-2 minutes for changes to take effect")
    print("6. Try running your application again")
