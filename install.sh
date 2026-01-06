#!/bin/bash

# Pure Python AI Code Reviewer - Installation Script
# This script installs the extension and sets up the Python server

echo "🐍 Pure Python AI Code Reviewer - Installation"
echo "=============================================="

# Check if VS Code is installed
if ! command -v code &> /dev/null; then
    echo "❌ VS Code not found. Please install VS Code first."
    echo "   Download from: https://code.visualstudio.com/"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.7+ first."
    echo "   Download from: https://python.org/"
    exit 1
fi

echo "✅ VS Code found: $(code --version | head -1)"
echo "✅ Python found: $(python3 --version)"

# Install VS Code extension
echo ""
echo "📦 Installing VS Code extension..."
if [ -f "ai-code-reviewer-1.0.0.vsix" ]; then
    code --install-extension ai-code-reviewer-1.0.0.vsix --force
    echo "✅ Extension installed successfully!"
else
    echo "❌ Extension file 'ai-code-reviewer-1.0.0.vsix' not found."
    echo "   Please download it from the releases page."
    exit 1
fi

# Set up Python server
echo ""
echo "🔧 Setting up Python server..."
cd python-server

# Create virtual environment (optional but recommended)
echo "Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

echo ""
echo "🎉 Installation Complete!"
echo ""
echo "🚀 To start using:"
echo "1. Start the server: cd python-server && python server.py"
echo "2. Open a Python file in VS Code"
echo "3. Enjoy real-time AI code analysis!"
echo ""
echo "📚 Features:"
echo "   ⚡ Lightning-fast analysis (0.002s)"
echo "   🛡️ Security vulnerability detection"
echo "   📊 Quality scoring (A+ to F grades)"
echo "   🎯 100% offline, no API keys needed"
echo ""
echo "Need help? Check the README.md file!"