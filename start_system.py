#!/usr/bin/env python3
"""
Script khởi động toàn bộ hệ thống LearnTwinChain
"""

import subprocess
import sys
import os
import time
import requests
from pathlib import Path

def check_backend_health():
    """Kiểm tra backend có hoạt động không"""
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        return response.status_code == 200
    except:
        return False

def start_backend():
    """Khởi động backend FastAPI"""
    print("🚀 Starting Backend (FastAPI)...")
    backend_dir = Path(__file__).parent / "backend"
    
    try:
        # Kiểm tra virtual environment
        venv_python = backend_dir / "venv" / "Scripts" / "python.exe"
        if not venv_python.exists():
            print("❌ Virtual environment not found. Please run:")
            print(f"   cd {backend_dir}")
            print("   python -m venv venv")
            print("   venv\\Scripts\\activate")
            print("   pip install -r requirements.txt")
            return False
        
        # Khởi động backend với uvicorn
        process = subprocess.Popen([
            str(venv_python), "-m", "uvicorn", "digital_twin.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"
        ], cwd=backend_dir)
        
        # Đợi backend khởi động
        print("⏳ Waiting for backend to start...")
        for i in range(30):  # Đợi tối đa 30 giây
            if check_backend_health():
                print("✅ Backend is running on http://localhost:8000")
                return process
            time.sleep(1)
        
        print("❌ Backend failed to start")
        process.terminate()
        return False
        
    except Exception as e:
        print(f"❌ Error starting backend: {e}")
        return False

def start_frontend():
    """Khởi động student frontend"""
    print("🚀 Starting Student Frontend...")
    frontend_dir = Path(__file__).parent
    
    try:
        # Kiểm tra node_modules
        if not (frontend_dir / "node_modules").exists():
            print("📦 Installing dependencies...")
            subprocess.run(["npm", "install"], cwd=frontend_dir, check=True)
        
        # Khởi động frontend với port 5173
        process = subprocess.Popen(["npm", "run", "dev"], cwd=frontend_dir)
        print("✅ Student Frontend is starting on http://localhost:5173")
        return process
        
    except Exception as e:
        print(f"❌ Error starting frontend: {e}")
        return False

def start_school_dashboard():
    """Khởi động school dashboard"""
    print("🚀 Starting School Dashboard...")
    dashboard_dir = Path(__file__).parent / "frontend-dgt"
    
    try:
        # Kiểm tra node_modules
        if not (dashboard_dir / "node_modules").exists():
            print("📦 Installing dashboard dependencies...")
            subprocess.run(["npm", "install"], cwd=dashboard_dir, check=True)
        
        # Khởi động dashboard với port 5180 (Vite)
        process = subprocess.Popen(["npm", "run", "dev"], cwd=dashboard_dir)
        print("✅ School Dashboard is starting on http://localhost:5180")
        return process
        
    except Exception as e:
        print(f"❌ Error starting dashboard: {e}")
        return False

def main():
    print("🎓 LearnTwinChain System Startup")
    print("=" * 50)
    
    processes = []
    
    try:
        # Khởi động backend
        backend_process = start_backend()
        if backend_process:
            processes.append(("Backend", backend_process))
        else:
            print("❌ Failed to start backend. Exiting.")
            return
        
        # Đợi một chút để backend ổn định
        time.sleep(2)
        
        # Khởi động frontend
        frontend_process = start_frontend()
        if frontend_process:
            processes.append(("Student Frontend", frontend_process))
        
        # Khởi động school dashboard
        dashboard_process = start_school_dashboard()
        if dashboard_process:
            processes.append(("School Dashboard", dashboard_process))
        
        print("\n" + "=" * 50)
        print("🎉 System is running!")
        print("\n📱 Access points:")
        print("   • Student Frontend: http://localhost:5173")
        print("   • School Dashboard:  http://localhost:5180")
        print("   • Backend API:       http://localhost:8000")
        print("   • API Docs:          http://localhost:8000/docs")
        
        print("\n💡 Tips:")
        print("   • Press Ctrl+C to stop all services")
        print("   • Check logs in each terminal window")
        print("   • Use API docs to test endpoints")
        
        # Giữ script chạy
        print("\n⏳ Press Ctrl+C to stop all services...")
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n\n🛑 Stopping all services...")
        for name, process in processes:
            print(f"   Stopping {name}...")
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
        print("✅ All services stopped")

if __name__ == "__main__":
    main() 