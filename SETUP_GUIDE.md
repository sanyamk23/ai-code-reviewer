# 🚀 Pure Python AI Code Reviewer - Setup Guide

## 📋 Quick Setup (5 minutes)

Your extension is installed, but you need to set up the Python server for it to work.

### **Step 1: Download Python Server**

Choose one method:

#### **Method A: Download from GitHub**
```bash
# Download the repository
git clone https://github.com/sanyamk23/ai-code-reviewer.git
cd ai-code-reviewer/python-server
```

#### **Method B: Download ZIP**
1. Go to: https://github.com/sanyamk23/ai-code-reviewer
2. Click "Code" → "Download ZIP"
3. Extract and navigate to `python-server` folder

### **Step 2: Install Dependencies**

```bash
# Install Python packages
pip install -r requirements.txt
```

**Required packages:**
- flask
- flask-cors
- pylint, ruff, flake8, black, isort
- bandit, mypy
- radon

### **Step 3: Start the Server**

```bash
# Start the analysis server
python server.py
```

You should see:
```
🚀 Starting Advanced Ultimate Python Code Analyzer
📡 Server URL: http://localhost:5001
✅ All 7 external tools available
```

### **Step 4: Test the Extension**

1. **Open VS Code**
2. **Open any Python file**
3. **You should see real-time analysis!**

## 🔧 Troubleshooting

### **Issue: "Server not running" error**

**Solution:** Make sure the Python server is running on port 5001
```bash
# Check if server is running
curl http://localhost:5001/health
```

### **Issue: "Module not found" errors**

**Solution:** Install missing Python packages
```bash
# Install all dependencies
pip install flask flask-cors pylint ruff flake8 black isort bandit mypy radon
```

### **Issue: "Permission denied" on macOS/Linux**

**Solution:** Use Python 3 explicitly
```bash
python3 server.py
```

### **Issue: Port 5001 already in use**

**Solution:** Kill existing process or change port
```bash
# Kill process on port 5001
lsof -ti:5001 | xargs kill -9

# Or change port in VS Code settings
# File → Preferences → Settings → Search "aiCodeReviewer.serverUrl"
# Change to: http://localhost:5002
```

## ⚙️ VS Code Settings

Configure the extension in VS Code settings:

```json
{
  "aiCodeReviewer.serverUrl": "http://localhost:5001",
  "aiCodeReviewer.enableRealTime": true,
  "aiCodeReviewer.analyzeOnSave": true,
  "aiCodeReviewer.enableSecurityAnalysis": true,
  "aiCodeReviewer.enablePerformanceAnalysis": true
}
```

## 🎯 What You Get

Once setup is complete:

✅ **Real-time analysis** as you type  
✅ **Security vulnerability detection**  
✅ **Performance optimization suggestions**  
✅ **Complete PEP8 compliance checking**  
✅ **Quality scoring (A+ to F grades)**  
✅ **Technical debt calculation**  
✅ **Smart deduplication**  

## 🚀 Advanced Setup (Optional)

### **Auto-start Server (macOS/Linux)**

Create a startup script:

```bash
# Create startup script
cat > ~/start-ai-reviewer.sh << 'EOF'
#!/bin/bash
cd /path/to/ai-code-reviewer/python-server
python server.py
EOF

# Make executable
chmod +x ~/start-ai-reviewer.sh

# Run on startup
echo "~/start-ai-reviewer.sh &" >> ~/.bashrc
```

### **Windows Auto-start**

Create `start-server.bat`:
```batch
@echo off
cd C:\path\to\ai-code-reviewer\python-server
python server.py
```

Add to Windows startup folder.

## 💡 Pro Tips

1. **Keep server running** - Leave it running in background for best experience
2. **Use virtual environment** - Isolate dependencies
3. **Update regularly** - Check GitHub for updates
4. **Customize settings** - Adjust analysis preferences in VS Code

## 🆘 Need Help?

- **GitHub Issues**: https://github.com/sanyamk23/ai-code-reviewer/issues
- **Documentation**: https://github.com/sanyamk23/ai-code-reviewer
- **Email**: sanyamkumat2305@gmail.com

---

**Once setup is complete, you'll have the most advanced offline Python code analyzer available!** 🐍✨