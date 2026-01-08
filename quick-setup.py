#!/usr/bin/env python3
"""
Quick Setup Script for Pure Python AI Code Reviewer
This script automatically downloads and sets up the Python server.
"""

import os
import sys
import subprocess
import urllib.request
import zipfile
import tempfile
import shutil
from pathlib import Path

def print_step(step, message):
    print(f"\n🔧 Step {step}: {message}")

def run_command(command, description):
    print(f"   Running: {description}")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        return True
    except subprocess.CalledProcessError as e:
        print(f"   ❌ Error: {e}")
        return False

def main():
    print("🚀 Pure Python AI Code Reviewer - Quick Setup")
    print("=" * 50)
    
    # Step 1: Check Python
    print_step(1, "Checking Python installation")
    if sys.version_info < (3, 7):
        print("   ❌ Python 3.7+ required. Please upgrade Python.")
        return False
    print(f"   ✅ Python {sys.version.split()[0]} found")
    
    # Step 2: Create setup directory
    print_step(2, "Creating setup directory")
    setup_dir = Path.home() / "ai-code-reviewer"
    setup_dir.mkdir(exist_ok=True)
    os.chdir(setup_dir)
    print(f"   ✅ Setup directory: {setup_dir}")
    
    # Step 3: Download repository
    print_step(3, "Downloading Python server")
    repo_url = "https://github.com/sanyamk23/ai-code-reviewer/archive/refs/heads/main.zip"
    
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.zip') as tmp_file:
            urllib.request.urlretrieve(repo_url, tmp_file.name)
            
            with zipfile.ZipFile(tmp_file.name, 'r') as zip_ref:
                zip_ref.extractall(setup_dir)
            
            os.unlink(tmp_file.name)
        print("   ✅ Repository downloaded and extracted")
    except Exception as e:
        print(f"   ❌ Download failed: {e}")
        return False
    
    # Step 4: Move to python-server directory
    print_step(4, "Setting up Python server")
    server_dir = setup_dir / "ai-code-reviewer-main" / "python-server"
    if not server_dir.exists():
        print("   ❌ Python server directory not found")
        return False
    
    os.chdir(server_dir)
    print(f"   ✅ Changed to: {server_dir}")
    
    # Step 5: Install dependencies
    print_step(5, "Installing Python dependencies")
    packages = [
        "flask==2.3.3",
        "flask-cors==4.0.0",
        "pylint==2.17.5",
        "bandit==1.7.5",
        "mypy==1.7.0",
        "black==23.11.0",
        "isort==5.12.0",
        "flake8==6.1.0",
        "ruff==0.1.6",
        "autopep8==2.0.4",
        "pycodestyle==2.11.1",
        "pydocstyle==6.3.0",
        "radon==6.0.1"
    ]
    
    for package in packages:
        if not run_command(f"pip install {package}", f"Installing {package.split('==')[0]}"):
            print(f"   ⚠️  Failed to install {package}, continuing...")
    
    print("   ✅ Dependencies installation completed")
    
    # Step 6: Test server
    print_step(6, "Testing server startup")
    print("   Starting server (this may take a moment)...")
    
    try:
        # Start server in background and test
        import threading
        import time
        import requests
        
        def start_server():
            subprocess.run([sys.executable, "server.py"], check=True)
        
        server_thread = threading.Thread(target=start_server, daemon=True)
        server_thread.start()
        
        # Wait for server to start
        time.sleep(3)
        
        # Test server
        response = requests.get("http://localhost:5001/health", timeout=5)
        if response.status_code == 200:
            print("   ✅ Server started successfully!")
        else:
            print("   ⚠️  Server started but health check failed")
            
    except Exception as e:
        print(f"   ⚠️  Server test failed: {e}")
    
    # Step 7: Create startup script
    print_step(7, "Creating startup script")
    
    if os.name == 'nt':  # Windows
        script_path = setup_dir / "start-ai-reviewer.bat"
        script_content = f"""@echo off
cd "{server_dir}"
python server.py
pause"""
    else:  # macOS/Linux
        script_path = setup_dir / "start-ai-reviewer.sh"
        script_content = f"""#!/bin/bash
cd "{server_dir}"
python server.py"""
    
    with open(script_path, 'w') as f:
        f.write(script_content)
    
    if os.name != 'nt':
        os.chmod(script_path, 0o755)
    
    print(f"   ✅ Startup script created: {script_path}")
    
    # Final instructions
    print("\n🎉 Setup Complete!")
    print("=" * 50)
    print("📋 Next Steps:")
    print(f"1. To start the server manually:")
    print(f"   cd {server_dir}")
    print(f"   python server.py")
    print(f"\n2. Or use the startup script:")
    print(f"   {script_path}")
    print(f"\n3. Open VS Code and test with any Python file")
    print(f"\n4. The server should show: http://localhost:5001")
    print(f"\n✅ Your Pure Python AI Code Reviewer is ready!")
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        if not success:
            print("\n❌ Setup failed. Please check the errors above.")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Setup cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)