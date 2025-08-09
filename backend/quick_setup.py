#!/usr/bin/env python3
"""
Quick setup script for LearnTwinChain Backend
Automates initial setup and validation
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

def print_banner():
    """Print setup banner"""
    print("=" * 60)
    print("🚀 LearnTwinChain Backend Quick Setup")
    print("=" * 60)
    print()

def check_requirements():
    """Check if required software is installed"""
    print("📋 Checking system requirements...")
    
    requirements = {
        'python': ['python', '--version'],
        'pip': ['pip', '--version'],
        'node': ['node', '--version'],
        'npm': ['npm', '--version'],
        'docker': ['docker', '--version'],
        'docker-compose': ['docker-compose', '--version']
    }
    
    missing = []
    
    for name, cmd in requirements.items():
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            version = result.stdout.strip().split('\n')[0]
            print(f"   ✅ {name}: {version}")
        except (subprocess.CalledProcessError, FileNotFoundError):
            print(f"   ❌ {name}: Not found")
            missing.append(name)
    
    if missing:
        print(f"\n⚠️  Missing requirements: {', '.join(missing)}")
        print("Please install missing software before continuing.")
        return False
    
    print("   ✅ All requirements satisfied!")
    return True

def setup_env_file():
    """Setup environment file"""
    print("\n📄 Setting up environment file...")
    
    env_file = Path('.env')
    example_file = Path('env.example')
    config_example = Path('config/env.example')
    
    if env_file.exists():
        print("   ⚠️  .env file already exists")
        response = input("   Do you want to overwrite it? (y/N): ").lower()
        if response != 'y':
            print("   Skipping .env setup")
            return True
    
    # Try to copy from available example files
    if example_file.exists():
        shutil.copy(example_file, env_file)
        print(f"   ✅ Created .env from {example_file}")
    elif config_example.exists():
        shutil.copy(config_example, env_file)
        print(f"   ✅ Created .env from {config_example}")
    else:
        print("   ❌ No env.example file found")
        return False
    
    print("   📝 Please edit .env file with your actual credentials")
    return True

def install_python_deps():
    """Install Python dependencies"""
    print("\n📦 Installing Python dependencies...")
    
    if not Path('requirements.txt').exists():
        print("   ❌ requirements.txt not found")
        return False
    
    try:
        # Check if virtual environment exists
        venv_path = Path('venv')
        if not venv_path.exists():
            print("   📁 Creating virtual environment...")
            subprocess.run([sys.executable, '-m', 'venv', 'venv'], check=True)
        
        # Determine activation script
        if os.name == 'nt':  # Windows
            pip_path = venv_path / 'Scripts' / 'pip.exe'
            activate_cmd = str(venv_path / 'Scripts' / 'activate.bat')
        else:  # Unix/Linux/Mac
            pip_path = venv_path / 'bin' / 'pip'
            activate_cmd = f"source {venv_path}/bin/activate"
        
        # Install dependencies
        print("   📥 Installing packages...")
        subprocess.run([str(pip_path), 'install', '--upgrade', 'pip'], check=True)
        subprocess.run([str(pip_path), 'install', '-r', 'requirements.txt'], check=True)
        
        print("   ✅ Python dependencies installed successfully!")
        print(f"   💡 To activate venv, run: {activate_cmd}")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"   ❌ Failed to install Python dependencies: {e}")
        return False

def install_node_deps():
    """Install Node.js dependencies"""
    print("\n📦 Installing Node.js dependencies...")
    
    if not Path('package.json').exists():
        print("   ❌ package.json not found")
        return False
    
    try:
        subprocess.run(['npm', 'install'], check=True)
        print("   ✅ Node.js dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"   ❌ Failed to install Node.js dependencies: {e}")
        return False

def setup_docker_services():
    """Setup Docker services"""
    print("\n🐳 Setting up Docker services...")
    
    if not Path('docker-compose.yml').exists():
        print("   ❌ docker-compose.yml not found")
        return False
    
    try:
        # Check if services are already running
        result = subprocess.run(['docker-compose', 'ps'], capture_output=True, text=True)
        if 'Up' in result.stdout:
            print("   ✅ Docker services already running")
            return True
        
        # Start services
        print("   🚀 Starting Docker services...")
        subprocess.run(['docker-compose', 'up', '-d', 'mongodb', 'redis'], check=True)
        
        # Wait a moment for services to start
        import time
        time.sleep(5)
        
        # Check if services started successfully
        result = subprocess.run(['docker-compose', 'ps'], capture_output=True, text=True)
        if 'Up' in result.stdout:
            print("   ✅ Docker services started successfully!")
            return True
        else:
            print("   ⚠️  Docker services may not have started properly")
            return False
            
    except subprocess.CalledProcessError as e:
        print(f"   ❌ Failed to start Docker services: {e}")
        return False

def compile_contracts():
    """Compile smart contracts"""
    print("\n🔨 Compiling smart contracts...")
    
    if not Path('hardhat.config.js').exists():
        print("   ❌ hardhat.config.js not found")
        return False
    
    try:
        subprocess.run(['npx', 'hardhat', 'compile'], check=True)
        print("   ✅ Smart contracts compiled successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"   ❌ Failed to compile contracts: {e}")
        return False

def run_environment_check():
    """Run environment validation"""
    print("\n🔍 Running environment validation...")
    
    check_script = Path('check_env.py')
    if not check_script.exists():
        print("   ⚠️  check_env.py not found, skipping validation")
        return True
    
    try:
        subprocess.run([sys.executable, 'check_env.py'], check=True)
        print("   ✅ Environment validation passed!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"   ⚠️  Environment validation had issues: {e}")
        print("   💡 This is normal if you haven't configured all services yet")
        return True

def print_next_steps():
    """Print next steps"""
    print("\n" + "=" * 60)
    print("🎉 Setup completed!")
    print("=" * 60)
    print("\n📋 Next steps:")
    print("1. Edit .env file with your actual credentials")
    print("2. Configure external services (Gemini, Milvus, Pinata, etc.)")
    print("3. Deploy smart contracts: python scripts/deploy_contracts.py")
    print("4. Upload documents for RAG: python rag/upload_docs.py")
    print("5. Start the backend: python start_backend.py")
    print("\n📚 For detailed instructions, see SETUP.MD")
    print("\n🔧 Useful commands:")
    print("   - Check services: docker-compose ps")
    print("   - View logs: docker-compose logs -f")
    print("   - Stop services: docker-compose down")
    print("   - Restart services: docker-compose restart")
    print()

def main():
    """Main setup function"""
    print_banner()
    
    # Change to script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    steps = [
        ("System Requirements", check_requirements),
        ("Environment File", setup_env_file),
        ("Python Dependencies", install_python_deps),
        ("Node.js Dependencies", install_node_deps),
        ("Docker Services", setup_docker_services),
        ("Smart Contracts", compile_contracts),
        ("Environment Check", run_environment_check)
    ]
    
    success_count = 0
    
    for step_name, step_func in steps:
        try:
            if step_func():
                success_count += 1
            else:
                print(f"   ⚠️  {step_name} step had issues")
        except Exception as e:
            print(f"   ❌ {step_name} step failed: {e}")
    
    print(f"\n📊 Setup Summary: {success_count}/{len(steps)} steps completed successfully")
    
    if success_count >= 4:  # Most critical steps completed
        print_next_steps()
    else:
        print("\n⚠️  Setup incomplete. Please check errors above and try again.")
        print("💡 You can also run individual setup steps manually.")

if __name__ == "__main__":
    main()