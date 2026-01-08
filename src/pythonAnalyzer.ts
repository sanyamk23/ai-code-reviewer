/**
 * Pure TypeScript Python Code Analyzer
 * Embedded analysis without external server dependency
 */

interface AnalysisResult {
  findings: Finding[];
  metrics: CodeMetrics;
  status: 'success' | 'error';
  error?: string;
}

interface Finding {
  id: string;
  source: string;
  severity: 'error' | 'warning' | 'info' | 'suggestion';
  message: string;
  line: number;
  column?: number;
  suggestion: string;
  category: string;
}

interface CodeMetrics {
  lines_of_code: number;
  total_lines: number;
  functions: number;
  classes: number;
  complexity_score: number;
}

export class EmbeddedPythonAnalyzer {
  
  /**
   * Analyze Python code without external dependencies
   */
  public analyze(code: string, filename: string = 'temp.py'): AnalysisResult {
    const findings: Finding[] = [];
    const lines = code.split('\n');
    
    try {
      // Basic syntax and style analysis
      findings.push(...this.analyzeSyntax(lines));
      findings.push(...this.analyzePEP8(lines));
      findings.push(...this.analyzeSecurity(lines));
      findings.push(...this.analyzePerformance(lines));
      findings.push(...this.analyzeComplexity(lines));
      
      const metrics = this.calculateMetrics(lines);
      
      return {
        findings: this.deduplicateFindings(findings),
        metrics,
        status: 'success'
      };
      
    } catch (error) {
      return {
        findings: [],
        metrics: this.calculateMetrics(lines),
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  private analyzeSyntax(lines: string[]): Finding[] {
    const findings: Finding[] = [];
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();
      
      // Missing colons
      if (/^(if|elif|else|for|while|def|class|try|except|finally|with)\s/.test(trimmed) && 
          !trimmed.endsWith(':')) {
        findings.push({
          id: 'SYN001',
          source: 'syntax',
          severity: 'error',
          message: 'Missing colon at end of statement',
          line: lineNum,
          suggestion: 'Add colon (:) at the end of the line',
          category: 'syntax'
        });
      }
      
      // Indentation issues (basic check)
      if (line.length > 0 && line[0] === '\t' && line.includes('    ')) {
        findings.push({
          id: 'SYN002',
          source: 'syntax',
          severity: 'error',
          message: 'Mixed tabs and spaces in indentation',
          line: lineNum,
          suggestion: 'Use either tabs or spaces consistently (PEP8 recommends 4 spaces)',
          category: 'style'
        });
      }
    });
    
    return findings;
  }
  
  private analyzePEP8(lines: string[]): Finding[] {
    const findings: Finding[] = [];
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // Line length
      if (line.length > 79) {
        findings.push({
          id: 'E501',
          source: 'pep8',
          severity: line.length > 120 ? 'error' : 'warning',
          message: `Line too long (${line.length} > 79 characters)`,
          line: lineNum,
          suggestion: 'Break line into multiple lines or refactor',
          category: 'style'
        });
      }
      
      // Trailing whitespace
      if (line.endsWith(' ') || line.endsWith('\t')) {
        findings.push({
          id: 'W291',
          source: 'pep8',
          severity: 'info',
          message: 'Trailing whitespace',
          line: lineNum,
          suggestion: 'Remove trailing whitespace',
          category: 'style'
        });
      }
      
      // Missing spaces around operators
      if (/[a-zA-Z0-9_][=+\-*/][a-zA-Z0-9_]/.test(line)) {
        findings.push({
          id: 'E225',
          source: 'pep8',
          severity: 'warning',
          message: 'Missing whitespace around operator',
          line: lineNum,
          suggestion: 'Add spaces around operators: a + b',
          category: 'style'
        });
      }
      
      // Multiple imports on one line
      if (/^import\s+\w+,/.test(line.trim())) {
        findings.push({
          id: 'E401',
          source: 'pep8',
          severity: 'warning',
          message: 'Multiple imports on one line',
          line: lineNum,
          suggestion: 'Put each import on separate line',
          category: 'style'
        });
      }
    });
    
    return findings;
  }
  
  private analyzeSecurity(lines: string[]): Finding[] {
    const findings: Finding[] = [];
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();
      
      // SQL injection patterns
      if (/execute\s*\(\s*["\'].*%.*["\']/.test(line)) {
        findings.push({
          id: 'SEC001',
          source: 'security',
          severity: 'error',
          message: 'Potential SQL injection vulnerability',
          line: lineNum,
          suggestion: 'Use parameterized queries with placeholders',
          category: 'security'
        });
      }
      
      // Command injection
      if (/os\.system\s*\(|subprocess.*shell\s*=\s*True/.test(line)) {
        findings.push({
          id: 'SEC002',
          source: 'security',
          severity: 'error',
          message: 'Potential command injection',
          line: lineNum,
          suggestion: 'Avoid shell=True or validate input thoroughly',
          category: 'security'
        });
      }
      
      // Hardcoded secrets
      if (/(password|api_key|secret|token)\s*=\s*["\'][^"\']+["\']/.test(line.toLowerCase())) {
        findings.push({
          id: 'SEC003',
          source: 'security',
          severity: 'warning',
          message: 'Potential hardcoded secret',
          line: lineNum,
          suggestion: 'Move secrets to environment variables',
          category: 'security'
        });
      }
      
      // Dangerous functions
      if (/\b(eval|exec)\s*\(/.test(line)) {
        findings.push({
          id: 'SEC004',
          source: 'security',
          severity: 'error',
          message: 'Dangerous function usage',
          line: lineNum,
          suggestion: 'Avoid eval/exec functions or implement strict validation',
          category: 'security'
        });
      }
    });
    
    return findings;
  }
  
  private analyzePerformance(lines: string[]): Finding[] {
    const findings: Finding[] = [];
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      
      // String concatenation in loops
      if (line.includes('+=') && line.includes('"') || line.includes("'")) {
        // Check if we're in a loop context (simple heuristic)
        const isInLoop = this.isInLoopContext(lines, index);
        if (isInLoop) {
          findings.push({
            id: 'PERF001',
            source: 'performance',
            severity: 'warning',
            message: 'Inefficient string concatenation in loop',
            line: lineNum,
            suggestion: 'Use join() method or list comprehension',
            category: 'performance'
          });
        }
      }
      
      // Inefficient membership testing
      if (/\sin\s+\[.*\]/.test(line)) {
        findings.push({
          id: 'PERF002',
          source: 'performance',
          severity: 'info',
          message: 'Inefficient membership testing in list',
          line: lineNum,
          suggestion: 'Use set for O(1) membership testing',
          category: 'performance'
        });
      }
    });
    
    return findings;
  }
  
  private analyzeComplexity(lines: string[]): Finding[] {
    const findings: Finding[] = [];
    let nestingLevel = 0;
    let currentFunction = '';
    
    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmed = line.trim();
      
      // Track function definitions
      const funcMatch = trimmed.match(/^def\s+(\w+)/);
      if (funcMatch) {
        currentFunction = funcMatch[1];
        nestingLevel = 0;
      }
      
      // Track nesting level
      if (/^(if|elif|for|while|try|with)\s/.test(trimmed)) {
        nestingLevel++;
        
        if (nestingLevel > 3) {
          findings.push({
            id: 'COMP001',
            source: 'complexity',
            severity: 'warning',
            message: `High nesting level (${nestingLevel}) in function '${currentFunction}'`,
            line: lineNum,
            suggestion: 'Consider extracting nested logic into separate functions',
            category: 'complexity'
          });
        }
      }
      
      // Reset nesting on function end (simple heuristic)
      if (trimmed.startsWith('def ') || (trimmed === '' && nestingLevel > 0)) {
        nestingLevel = Math.max(0, nestingLevel - 1);
      }
    });
    
    return findings;
  }
  
  private calculateMetrics(lines: string[]): CodeMetrics {
    const codeLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 0 && !trimmed.startsWith('#');
    });
    
    const functions = lines.filter(line => line.trim().startsWith('def ')).length;
    const classes = lines.filter(line => line.trim().startsWith('class ')).length;
    
    return {
      lines_of_code: codeLines.length,
      total_lines: lines.length,
      functions,
      classes,
      complexity_score: Math.max(1, Math.min(10, Math.floor(codeLines.length / 10)))
    };
  }
  
  private isInLoopContext(lines: string[], currentIndex: number): boolean {
    // Look back up to 10 lines for loop keywords
    const startIndex = Math.max(0, currentIndex - 10);
    for (let i = startIndex; i < currentIndex; i++) {
      if (/^\s*(for|while)\s/.test(lines[i])) {
        return true;
      }
    }
    return false;
  }
  
  private deduplicateFindings(findings: Finding[]): Finding[] {
    const seen = new Set<string>();
    return findings.filter(finding => {
      const key = `${finding.line}-${finding.id}-${finding.message}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}