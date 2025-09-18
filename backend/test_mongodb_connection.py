#!/usr/bin/env python3
"""
MongoDB Connection Test Script
Tests connection to MongoDB using environment variables with detailed debugging
"""

import os
import asyncio
import sys
from datetime import datetime
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ServerSelectionTimeoutError, ConnectionFailure, ConfigurationError

# Load environment variables
load_dotenv()

class MongoDBTester:
    def __init__(self):
        self.mongodb_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/learntwinchain")
        self.database_name = os.getenv("MONGODB_DB_NAME", "learntwinchain")
        self.client = None
        
    def print_debug_info(self):
        """Print debugging information about the connection"""
        print("=" * 60)
        print("MongoDB Connection Test - Debug Information")
        print("=" * 60)
        print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Python Version: {sys.version}")
        print(f"Current Working Directory: {os.getcwd()}")
        print()
        
        # Environment variables
        print("Environment Variables:")
        print(f"  MONGODB_URI: {self.mongodb_uri}")
        print(f"  MONGODB_DB_NAME: {self.database_name}")
        print()
        
        # Parse URI for debugging
        if "mongodb+srv://" in self.mongodb_uri:
            print("Connection Type: MongoDB Atlas (SRV)")
            # Extract cluster info
            try:
                parts = self.mongodb_uri.split("@")
                if len(parts) > 1:
                    cluster_part = parts[1].split("/")[0]
                    print(f"  Cluster: {cluster_part}")
            except:
                print("  Cluster: Could not parse")
        elif "mongodb://" in self.mongodb_uri:
            print("Connection Type: MongoDB (Standard)")
        else:
            print("Connection Type: Unknown/Invalid")
        print()
        
    async def test_basic_connection(self):
        """Test basic MongoDB connection"""
        print("Testing Basic Connection...")
        print("-" * 40)
        
        try:
            # Enhanced connection options
            connection_options = {
                "serverSelectionTimeoutMS": 30000,  # 30 seconds
                "connectTimeoutMS": 30000,          # 30 seconds
                "socketTimeoutMS": 30000,           # 30 seconds
                "maxPoolSize": 10,
                "minPoolSize": 1,
                "maxIdleTimeMS": 30000,
                "retryWrites": True,
                "retryReads": True,
                "heartbeatFrequencyMS": 10000,
            }
            
            print(f"Creating client with options: {connection_options}")
            self.client = AsyncIOMotorClient(self.mongodb_uri, **connection_options)
            
            print("Testing ping command...")
            result = await self.client.admin.command('ping')
            print(f"✅ Ping successful: {result}")
            
            return True
            
        except ServerSelectionTimeoutError as e:
            print(f"❌ Server Selection Timeout: {e}")
            print("This usually means:")
            print("  - Network connectivity issues")
            print("  - Firewall blocking the connection")
            print("  - MongoDB server is down")
            print("  - IP address not whitelisted in MongoDB Atlas")
            return False
            
        except ConnectionFailure as e:
            print(f"❌ Connection Failure: {e}")
            print("This usually means:")
            print("  - Invalid connection string")
            print("  - Authentication failed")
            print("  - Database server is unreachable")
            return False
            
        except ConfigurationError as e:
            print(f"❌ Configuration Error: {e}")
            print("This usually means:")
            print("  - Invalid URI format")
            print("  - Missing required parameters")
            return False
            
        except Exception as e:
            print(f"❌ Unexpected Error: {e}")
            print(f"Error Type: {type(e).__name__}")
            return False
    
    async def test_database_access(self):
        """Test database access and basic operations"""
        print("\nTesting Database Access...")
        print("-" * 40)
        
        try:
            if not self.client:
                print("❌ No client connection available")
                return False
                
            database = self.client[self.database_name]
            print(f"Accessing database: {self.database_name}")
            
            # List collections
            collections = await database.list_collection_names()
            print(f"✅ Collections found: {len(collections)}")
            if collections:
                print(f"  Collections: {collections[:5]}{'...' if len(collections) > 5 else ''}")
            else:
                print("  No collections found (empty database)")
            
            # Test a simple operation
            test_collection = database["connection_test"]
            test_doc = {
                "test": True,
                "timestamp": datetime.now(),
                "message": "MongoDB connection test successful"
            }
            
            result = await test_collection.insert_one(test_doc)
            print(f"✅ Test document inserted: {result.inserted_id}")
            
            # Clean up test document
            await test_collection.delete_one({"_id": result.inserted_id})
            print("✅ Test document cleaned up")
            
            return True
            
        except Exception as e:
            print(f"❌ Database Access Error: {e}")
            return False
    
    async def test_network_connectivity(self):
        """Test basic network connectivity"""
        print("\nTesting Network Connectivity...")
        print("-" * 40)
        
        import socket
        
        # Extract hostname from URI
        try:
            if "mongodb+srv://" in self.mongodb_uri:
                # For SRV, we need to resolve the cluster name
                parts = self.mongodb_uri.split("@")
                if len(parts) > 1:
                    cluster_part = parts[1].split("/")[0]
                    hostname = cluster_part
                else:
                    print("❌ Could not parse cluster name from URI")
                    return False
            else:
                # For standard MongoDB URI
                hostname = self.mongodb_uri.split("://")[1].split(":")[0]
            
            print(f"Testing connectivity to: {hostname}")
            
            # Test DNS resolution
            try:
                ip_addresses = socket.gethostbyname_ex(hostname)
                print(f"✅ DNS Resolution successful: {ip_addresses[2]}")
            except socket.gaierror as e:
                print(f"❌ DNS Resolution failed: {e}")
                return False
            
            # Test port connectivity (MongoDB default port 27017)
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(10)
                result = sock.connect_ex((hostname, 27017))
                sock.close()
                
                if result == 0:
                    print("✅ Port 27017 is accessible")
                else:
                    print("❌ Port 27017 is not accessible")
                    return False
                    
            except Exception as e:
                print(f"❌ Port connectivity test failed: {e}")
                return False
                
            return True
            
        except Exception as e:
            print(f"❌ Network connectivity test failed: {e}")
            return False
    
    async def run_all_tests(self):
        """Run all connection tests"""
        self.print_debug_info()
        
        # Test network connectivity first
        network_ok = await self.test_network_connectivity()
        
        # Test basic connection
        connection_ok = await self.test_basic_connection()
        
        # Test database access if connection is OK
        database_ok = False
        if connection_ok:
            database_ok = await self.test_database_access()
        
        # Summary
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        print(f"Network Connectivity: {'✅ PASS' if network_ok else '❌ FAIL'}")
        print(f"Basic Connection:     {'✅ PASS' if connection_ok else '❌ FAIL'}")
        print(f"Database Access:      {'✅ PASS' if database_ok else '❌ FAIL'}")
        
        if network_ok and connection_ok and database_ok:
            print("\n🎉 All tests passed! MongoDB connection is working correctly.")
        else:
            print("\n⚠️  Some tests failed. Check the error messages above for troubleshooting.")
            
            if not network_ok:
                print("\nNetwork Troubleshooting:")
                print("1. Check your internet connection")
                print("2. Verify firewall settings")
                print("3. For MongoDB Atlas: Check if your IP is whitelisted")
                
            if not connection_ok:
                print("\nConnection Troubleshooting:")
                print("1. Verify MONGODB_URI is correct")
                print("2. Check username/password in connection string")
                print("3. Ensure MongoDB server is running")
                
            if not database_ok:
                print("\nDatabase Troubleshooting:")
                print("1. Verify database name is correct")
                print("2. Check user permissions")
                print("3. Ensure database exists")
        
        # Clean up
        if self.client:
            self.client.close()
            print("\n✅ Connection closed")

async def main():
    """Main function to run the MongoDB connection test"""
    tester = MongoDBTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    print("Starting MongoDB Connection Test...")
    asyncio.run(main())
