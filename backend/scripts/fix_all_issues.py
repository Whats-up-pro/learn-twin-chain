#!/usr/bin/env python3
"""
Script to fix all known issues in the system
"""
import asyncio
import subprocess
import sys
import os

def run_script(script_name):
    """Run a Python script"""
    script_path = os.path.join(os.path.dirname(__file__), script_name)
    print(f"\n{'='*50}")
    print(f"Running {script_name}...")
    print(f"{'='*50}")
    
    try:
        result = subprocess.run([sys.executable, script_path], 
                              capture_output=True, text=True, cwd=os.path.dirname(__file__))
        
        if result.stdout:
            print(result.stdout)
        
        if result.stderr:
            print("Errors:", result.stderr)
        
        if result.returncode == 0:
            print(f"✅ {script_name} completed successfully")
        else:
            print(f"❌ {script_name} failed with return code {result.returncode}")
            
        return result.returncode == 0
        
    except Exception as e:
        print(f"❌ Error running {script_name}: {e}")
        return False

def main():
    """Run all fix scripts"""
    print("🔧 Starting system fixes...")
    
    # Run timezone fix
    timezone_success = run_script("fix_timezone_data.py")
    
    # Run RBAC fix
    rbac_success = run_script("check_rbac_system.py")
    
    print(f"\n{'='*50}")
    print("SUMMARY:")
    print(f"{'='*50}")
    print(f"Timezone fix: {'✅ SUCCESS' if timezone_success else '❌ FAILED'}")
    print(f"RBAC fix: {'✅ SUCCESS' if rbac_success else '❌ FAILED'}")
    
    if timezone_success and rbac_success:
        print("\n🎉 All fixes completed successfully!")
        print("The system should now work properly.")
    else:
        print("\n⚠️  Some fixes failed. Please check the errors above.")
        print("You may need to run the failed scripts manually.")

if __name__ == "__main__":
    main()
