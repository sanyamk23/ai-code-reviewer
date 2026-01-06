@echo off
REM Pure Python AI Code Reviewer - Windows Installation Script

echo 🐍 Pure Python AI Code Reviewer - Installation
echo ==============================================

REM Check if VS Code is installed
where code >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ VS Code not found. Please install VS Code first.
    echo    Download from: https://code.visualstudio.com/
    pause
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Python not found. Please install Python 3.7+ first.
    echo    Download from: https://python.org/
    pause
    exit /b 1
)

echo ✅ VS Code found
echo ✅ Python found

REM Install VS Code extension
echo.
echo 📦 Installing VS Code extension...
if exist "ai-code-reviewer-1.0.0.vsix" (
    code --install-extension ai-code-reviewer-1.0.0.vsix --force
    echo ✅ Extension installed successfully!
) else (
    echo ❌ Extension file 'ai-code-reviewer-1.0.0.vsix' not found.
    echo    Please download it from the releases page.
    pause
    exit /b 1
)

REM Set up Python server
echo.
echo 🔧 Setting up Python server...
cd python-server

REM Create virtual environment (optional but recommended)
echo Creating virtual environment...
python -m venv venv
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing Python dependencies...
pip install -r requirements.txt

echo.
echo 🎉 Installation Complete!
echo.
echo 🚀 To start using:
echo 1. Start the server: cd python-server ^&^& python server.py
echo 2. Open a Python file in VS Code
echo 3. Enjoy real-time AI code analysis!
echo.
echo 📚 Features:
echo    ⚡ Lightning-fast analysis (0.002s)
echo    🛡️ Security vulnerability detection
echo    📊 Quality scoring (A+ to F grades)
echo    🎯 100% offline, no API keys needed
echo.
echo Need help? Check the README.md file!
pause