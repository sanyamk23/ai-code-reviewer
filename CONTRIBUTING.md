# Contributing to Pure Python AI Code Reviewer

Thank you for your interest in contributing! This project aims to provide the best offline Python code analysis experience.

## 🚀 Quick Start

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/sanyamk23/ai-code-reviewer.git
   cd ai-code-reviewer
   ```

3. **Set up development environment**
   ```bash
   # Install Node.js dependencies
   npm install
   
   # Set up Python environment
   cd python-server
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Build and test**
   ```bash
   # Compile TypeScript
   npm run compile
   
   # Test Python server
   cd python-server
   python server.py
   ```

## 📋 Development Guidelines

### Code Style

**TypeScript/JavaScript:**
- Use TypeScript for all new code
- Follow VS Code extension conventions
- Use meaningful variable names
- Add JSDoc comments for public functions

**Python:**
- Follow PEP 8 style guide
- Use type hints for all functions
- Add docstrings for classes and functions
- Keep functions focused and small

### Testing

**Before submitting:**
1. Test the extension in VS Code
2. Verify Python server functionality
3. Check all analysis features work
4. Test with various Python code samples

### Commit Messages

Use conventional commit format:
```
feat: add new security analysis rule
fix: resolve duplicate findings issue
docs: update installation instructions
refactor: improve performance analysis
test: add unit tests for AST analyzer
```

## 🎯 Areas for Contribution

### High Priority
- **Additional Language Support** (JavaScript, TypeScript, Go)
- **Custom Rule Configuration** (user-defined analysis rules)
- **Performance Optimizations** (faster analysis algorithms)
- **UI/UX Improvements** (better VS Code integration)

### Medium Priority
- **Additional External Tools** (more linters and formatters)
- **Advanced Refactoring** (automated code improvements)
- **Team Features** (shared configurations)
- **CI/CD Integration** (GitHub Actions, Jenkins)

### Documentation
- **Tutorial Videos** (setup and usage guides)
- **Blog Posts** (technical deep dives)
- **Translation** (documentation in other languages)
- **Examples** (real-world usage scenarios)

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Environment Information**
   - VS Code version
   - Python version
   - Operating system
   - Extension version

2. **Steps to Reproduce**
   - Exact steps to trigger the bug
   - Sample code that causes the issue
   - Expected vs actual behavior

3. **Logs and Screenshots**
   - VS Code developer console output
   - Python server logs
   - Screenshots if UI-related

## 💡 Feature Requests

For new features:

1. **Check existing issues** to avoid duplicates
2. **Describe the use case** - why is this needed?
3. **Provide examples** - how would it work?
4. **Consider alternatives** - are there other solutions?

## 🔧 Development Setup Details

### VS Code Extension Development

```bash
# Install VS Code Extension Manager
npm install -g vsce

# Package extension for testing
vsce package

# Install locally
code --install-extension ai-code-reviewer-*.vsix
```

### Python Server Development

```bash
# Run with debug logging
cd python-server
python server.py --debug

# Run tests
python -m pytest tests/

# Check code quality
ruff check .
black --check .
mypy .
```

### Project Structure

```
ai-code-reviewer/
├── src/                    # VS Code extension source
│   └── extension.ts       # Main extension file
├── python-server/         # Analysis engine
│   ├── server.py         # Flask server
│   └── requirements.txt  # Python dependencies
├── test-files/           # Sample files for testing
├── package.json          # Extension manifest
└── README.md            # Documentation
```

## 📝 Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow coding standards
   - Add tests if applicable
   - Update documentation

3. **Test thoroughly**
   - Verify extension functionality
   - Test Python server
   - Check for regressions

4. **Submit pull request**
   - Clear title and description
   - Reference related issues
   - Include testing notes

5. **Code review**
   - Address feedback promptly
   - Keep discussions constructive
   - Be open to suggestions

## 🏆 Recognition

Contributors will be:
- Listed in the CONTRIBUTORS.md file
- Mentioned in release notes
- Given credit in documentation

## 📞 Getting Help

- **GitHub Issues** - For bugs and feature requests
- **Discussions** - For questions and ideas
- **Email** - For security issues or private matters

## 📜 Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold this code.

## 🎉 Thank You!

Every contribution, no matter how small, helps make this project better for the entire Python community. Thank you for your time and effort!

---

**Happy coding!** 🐍✨