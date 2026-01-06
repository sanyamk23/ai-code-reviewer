import * as vscode from 'vscode';
import axios from 'axios';

interface Finding {
  id: string;
  source: string;
  severity: 'error' | 'warning' | 'info' | 'suggestion';
  message: string;
  line: number;
  column?: number;
  end_line?: number;
  end_column?: number;
  suggestion?: string;
  fix_code?: string;
  confidence?: number;
  category?: string;
}

interface CodeSuggestion {
  type: string;
  original_code: string;
  suggested_code: string;
  explanation: string;
  confidence: number;
  line_start: number;
  line_end: number;
}

interface AnalysisResult {
  findings: Finding[];
  suggestions: CodeSuggestion[];
  metrics: {
    lines_of_code: number;
    total_lines: number;
    comment_lines: number;
    blank_lines: number;
    functions: number;
    classes: number;
  };
  ai_available: boolean;
  status: 'success' | 'error';
  error?: string;
}

interface AISuggestion {
  completion: string;
  explanation: string;
  confidence: number;
}

let diagnosticCollection: vscode.DiagnosticCollection;
let debounceTimer: NodeJS.Timeout | undefined;
let suggestionTimer: NodeJS.Timeout | undefined;
let statusBarItem: vscode.StatusBarItem;
let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
  console.log('Advanced AI Code Reviewer extension is now active');

  // Create output channel for logging
  outputChannel = vscode.window.createOutputChannel('AI Code Reviewer');
  context.subscriptions.push(outputChannel);

  // Create status bar item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = "$(sync~spin) AI Review: Initializing...";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Create diagnostic collection
  diagnosticCollection = vscode.languages.createDiagnosticCollection('aiCodeReviewer');
  context.subscriptions.push(diagnosticCollection);

  // Register commands
  const analyzeFileCommand = vscode.commands.registerCommand('aiCodeReviewer.analyzeFile', () => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      analyzeDocument(editor.document);
    }
  });

  const analyzeWorkspaceCommand = vscode.commands.registerCommand('aiCodeReviewer.analyzeWorkspace', () => {
    analyzeWorkspace();
  });

  const showMetricsCommand = vscode.commands.registerCommand('aiCodeReviewer.showMetrics', () => {
    showCodeMetrics();
  });

  const enableAICommand = vscode.commands.registerCommand('aiCodeReviewer.enableAI', () => {
    showAISetupInstructions();
  });

  const showSuggestionExplanationCommand = vscode.commands.registerCommand('aiCodeReviewer.showSuggestionExplanation', 
    (explanation: string, confidence: number) => {
      vscode.window.showInformationMessage(
        `⚡ AI Suggestion (${Math.round(confidence * 100)}%): ${explanation}`,
        'Got it'
      );
    }
  );

  context.subscriptions.push(analyzeFileCommand, analyzeWorkspaceCommand, showMetricsCommand, enableAICommand, showSuggestionExplanationCommand);

  // Register event listeners
  const onDidSaveDocument = vscode.workspace.onDidSaveTextDocument((document) => {
    const config = vscode.workspace.getConfiguration('aiCodeReviewer');
    if (config.get('analyzeOnSave') && isPythonFile(document)) {
      analyzeDocument(document);
    }
  });

  const onDidChangeDocument = vscode.workspace.onDidChangeTextDocument((event) => {
    const config = vscode.workspace.getConfiguration('aiCodeReviewer');
    if (config.get('enableRealTime') && isPythonFile(event.document)) {
      debounceAnalysis(event.document);
      
      // Real-time suggestions
      if (config.get('enableAISuggestions')) {
        debounceSuggestions(event.document, event.contentChanges);
      }
    }
  });

  const onDidOpenDocument = vscode.workspace.onDidOpenTextDocument((document) => {
    if (isPythonFile(document)) {
      analyzeDocument(document);
    }
  });

  const onDidChangeSelection = vscode.window.onDidChangeTextEditorSelection((event) => {
    const config = vscode.workspace.getConfiguration('aiCodeReviewer');
    if (config.get('enableAISuggestions') && isPythonFile(event.textEditor.document)) {
      const position = event.selections[0].active;
      showContextualSuggestions(event.textEditor.document, position);
    }
  });

  context.subscriptions.push(onDidSaveDocument, onDidChangeDocument, onDidOpenDocument, onDidChangeSelection);

  // Register completion provider for AI suggestions with multiple triggers
  const completionProvider = vscode.languages.registerCompletionItemProvider(
    'python',
    new AICompletionProvider(),
    '.', ' ', '\n', '(', ':', '=', '#'  // Trigger on various characters
  );

  // Register inline completion provider for ghost text (like Copilot)
  const inlineCompletionProvider = vscode.languages.registerInlineCompletionItemProvider(
    'python',
    new AIInlineCompletionProvider()
  );

  // Register code action provider for fixes
  const codeActionProvider = vscode.languages.registerCodeActionsProvider(
    'python',
    new EnhancedCodeActionProvider(),
    {
      providedCodeActionKinds: [
        vscode.CodeActionKind.QuickFix,
        vscode.CodeActionKind.Refactor,
        vscode.CodeActionKind.RefactorRewrite
      ]
    }
  );

  // Register hover provider for detailed explanations
  const hoverProvider = vscode.languages.registerHoverProvider(
    'python',
    new AIHoverProvider()
  );

  context.subscriptions.push(completionProvider, inlineCompletionProvider, codeActionProvider, hoverProvider);

  // Initialize server connection
  checkServerConnection();
}

function isPythonFile(document: vscode.TextDocument): boolean {
  return document.languageId === 'python';
}

function debounceAnalysis(document: vscode.TextDocument) {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  const config = vscode.workspace.getConfiguration('aiCodeReviewer');
  const debounceMs = config.get<number>('debounceMs', 1000);

  debounceTimer = setTimeout(() => {
    analyzeDocument(document);
  }, debounceMs);
}

function debounceSuggestions(document: vscode.TextDocument, changes: readonly vscode.TextDocumentContentChangeEvent[]) {
  if (suggestionTimer) {
    clearTimeout(suggestionTimer);
  }

  suggestionTimer = setTimeout(() => {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document === document) {
      generateRealTimeSuggestions(document, editor.selection.active);
    }
  }, 500); // Faster for suggestions
}

async function analyzeDocument(document: vscode.TextDocument) {
  try {
    statusBarItem.text = "$(sync~spin) AI Review: Analyzing...";
    
    const config = vscode.workspace.getConfiguration('aiCodeReviewer');
    const serverUrl = config.get<string>('serverUrl', 'http://localhost:5001');

    const code = document.getText();
    const filename = document.fileName;

    const response = await axios.post(`${serverUrl}/analyze`, {
      code,
      filename,
      context: {
        workspace: vscode.workspace.name,
        language: document.languageId
      }
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result: AnalysisResult = response.data;

    if (result.status === 'success') {
      updateDiagnostics(document, result.findings);
      updateStatusBar(result);
      
      // Show suggestions if available (but don't log every analysis)
      if (result.suggestions && result.suggestions.length > 0) {
        showSuggestionNotification(result.suggestions.length);
      }
      
      // Only log to output channel if there are significant findings
      const errorCount = result.findings.filter(f => f.severity === 'error').length;
      const warningCount = result.findings.filter(f => f.severity === 'warning').length;
      
      if (errorCount > 0 || warningCount > 0) {
        outputChannel.appendLine(`Analysis: ${errorCount} errors, ${warningCount} warnings found`);
      }
    } else {
      vscode.window.showErrorMessage(`Analysis failed: ${result.error}`);
      statusBarItem.text = "$(error) AI Review: Error";
    }

  } catch (error) {
    console.error('Analysis error:', error);
    statusBarItem.text = "$(error) AI Review: Error";
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        vscode.window.showWarningMessage(
          'AI Code Reviewer server is not running. Please start the Python server.',
          'Show Instructions'
        ).then(selection => {
          if (selection === 'Show Instructions') {
            showServerSetupInstructions();
          }
        });
      } else {
        vscode.window.showErrorMessage(`Analysis request failed: ${error.message}`);
      }
    }
  }
}

function updateDiagnostics(document: vscode.TextDocument, findings: Finding[]) {
  const diagnostics: vscode.Diagnostic[] = [];

  for (const finding of findings) {
    const line = Math.max(0, finding.line - 1);
    const column = finding.column || 0;
    const endLine = finding.end_line ? finding.end_line - 1 : line;
    const endColumn = finding.end_column || column + 1;
    
    const range = new vscode.Range(line, column, endLine, endColumn);
    const severity = getSeverity(finding.severity);
    
    // Create a cleaner message format
    let message = finding.message;
    if (finding.suggestion) {
      message += ` 💡 ${finding.suggestion}`;
    }
    
    const diagnostic = new vscode.Diagnostic(range, message, severity);
    
    // Cleaner source format
    diagnostic.source = `Pure Python AI (${finding.source})`;
    diagnostic.code = finding.id;
    
    // Add tags for better categorization
    if (finding.category === 'security') {
      diagnostic.tags = [vscode.DiagnosticTag.Deprecated]; // Use as security indicator
    }
    
    // Don't add relatedInformation since we already included suggestion in message
    // This prevents duplicate display of suggestions

    diagnostics.push(diagnostic);
  }

  diagnosticCollection.set(document.uri, diagnostics);
}

function getSeverity(severity: string): vscode.DiagnosticSeverity {
  switch (severity) {
    case 'error':
      return vscode.DiagnosticSeverity.Error;
    case 'warning':
      return vscode.DiagnosticSeverity.Warning;
    case 'info':
      return vscode.DiagnosticSeverity.Information;
    case 'suggestion':
      return vscode.DiagnosticSeverity.Hint;
    default:
      return vscode.DiagnosticSeverity.Information;
  }
}

function updateStatusBar(result: AnalysisResult) {
  const errorCount = result.findings.filter(f => f.severity === 'error').length;
  const warningCount = result.findings.filter(f => f.severity === 'warning').length;
  const suggestionCount = result.suggestions?.length || 0;
  
  let icon = "$(check)";
  if (errorCount > 0) {
    icon = "$(error)";
  } else if (warningCount > 0) {
    icon = "$(warning)";
  }
  
  statusBarItem.text = `${icon} AI Review: ${errorCount}E ${warningCount}W ${suggestionCount}S`;
  statusBarItem.tooltip = `Errors: ${errorCount}, Warnings: ${warningCount}, Suggestions: ${suggestionCount}`;
  
  if (result.ai_available) {
    statusBarItem.tooltip += " | AI Enhanced";
  }
}

async function generateRealTimeSuggestions(document: vscode.TextDocument, position: vscode.Position) {
  try {
    const config = vscode.workspace.getConfiguration('aiCodeReviewer');
    const serverUrl = config.get<string>('serverUrl', 'http://localhost:5001');

    const code = document.getText();
    
    // Try Pure Python AI endpoint for ultra-fast suggestions
    try {
      const pureResponse = await axios.post(`${serverUrl}/pure-suggest`, {
        code,
        cursor_line: position.line + 1,
        cursor_column: position.character,
        context: getContextAroundPosition(document, position),
        inline: true
      }, {
        timeout: 1000, // Very fast timeout for pure Python
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (pureResponse.data.status === 'success' && pureResponse.data.suggestions.length > 0) {
        const suggestions = pureResponse.data.suggestions as AISuggestion[];
        showInlineSuggestions(suggestions, position, 'pure-python-ai');
        return;
      }
    } catch (pureError) {
      console.log('Pure Python AI not available, falling back to regular endpoint');
    }
    
    // Fallback to regular suggestion endpoint
    const response = await axios.post(`${serverUrl}/suggest`, {
      code,
      cursor_line: position.line + 1,
      cursor_column: position.character
    }, {
      timeout: 3000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.status === 'success' && response.data.suggestions.length > 0) {
      const suggestions = response.data.suggestions as AISuggestion[];
      showInlineSuggestions(suggestions, position, 'pure-python');
    }

  } catch (error) {
    // Silently fail for real-time suggestions
    console.log('Real-time suggestion failed:', error);
  }
}

function getContextAroundPosition(document: vscode.TextDocument, position: vscode.Position): string {
  // Get 3 lines before and after cursor for context
  const startLine = Math.max(0, position.line - 3);
  const endLine = Math.min(document.lineCount - 1, position.line + 3);
  
  let context = '';
  for (let i = startLine; i <= endLine; i++) {
    const line = document.lineAt(i);
    context += line.text + '\n';
  }
  
  return context;
}

function showInlineSuggestions(suggestions: AISuggestion[], position: vscode.Position, provider: string = 'ai') {
  // Enhanced suggestion display with provider info
  outputChannel.appendLine(`Pure Python AI Suggestions (${provider}) at line ${position.line + 1}:`);
  suggestions.forEach((suggestion, index) => {
    const confidence = Math.round(suggestion.confidence * 100);
    outputChannel.appendLine(`  ${index + 1}. ${suggestion.completion} (${confidence}%) - ${suggestion.explanation}`);
  });
  
  // Show notification for high-confidence suggestions
  const highConfidenceSuggestions = suggestions.filter(s => s.confidence > 0.8);
  if (highConfidenceSuggestions.length > 0 && provider === 'pure-python-ai') {
    vscode.window.showInformationMessage(
      `🐍 Pure Python AI found ${highConfidenceSuggestions.length} high-confidence suggestions`,
      'View'
    ).then(selection => {
      if (selection === 'View') {
        outputChannel.show();
      }
    });
  }
}

async function showContextualSuggestions(document: vscode.TextDocument, position: vscode.Position) {
  // This could show contextual help based on cursor position
  // Implementation depends on specific requirements
}

async function analyzeWorkspace() {
  const pythonFiles = await vscode.workspace.findFiles('**/*.py', '**/node_modules/**');
  
  vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: "AI Code Review: Analyzing workspace...",
    cancellable: true
  }, async (progress, token) => {
    const total = pythonFiles.length;
    let processed = 0;
    
    for (const file of pythonFiles) {
      if (token.isCancellationRequested) {
        break;
      }

      const document = await vscode.workspace.openTextDocument(file);
      await analyzeDocument(document);
      
      processed++;
      progress.report({
        increment: (100 / total),
        message: `Analyzed ${processed}/${total} files`
      });
    }
    
    vscode.window.showInformationMessage(`Workspace analysis complete! Analyzed ${processed} Python files.`);
  });
}

async function showCodeMetrics() {
  const editor = vscode.window.activeTextEditor;
  if (!editor || !isPythonFile(editor.document)) {
    vscode.window.showWarningMessage('Please open a Python file to view metrics.');
    return;
  }

  try {
    const config = vscode.workspace.getConfiguration('aiCodeReviewer');
    const serverUrl = config.get<string>('serverUrl', 'http://localhost:5001');

    const response = await axios.post(`${serverUrl}/analyze`, {
      code: editor.document.getText(),
      filename: editor.document.fileName
    });

    const result: AnalysisResult = response.data;
    if (result.status === 'success' && result.metrics) {
      const metrics = result.metrics;
      const message = `Code Metrics:
Lines of Code: ${metrics.lines_of_code}
Total Lines: ${metrics.total_lines}
Comments: ${metrics.comment_lines}
Functions: ${metrics.functions}
Classes: ${metrics.classes}`;

      vscode.window.showInformationMessage(message);
    }
  } catch (error) {
    vscode.window.showErrorMessage('Failed to get code metrics.');
  }
}

function showSuggestionNotification(count: number) {
  vscode.window.showInformationMessage(
    `AI found ${count} improvement suggestions for your code.`,
    'View Output'
  ).then(selection => {
    if (selection === 'View Output') {
      outputChannel.show();
    }
  });
}

async function checkServerConnection() {
  try {
    const config = vscode.workspace.getConfiguration('aiCodeReviewer');
    const serverUrl = config.get<string>('serverUrl', 'http://localhost:5001');

    const response = await axios.get(`${serverUrl}/health`, { timeout: 5000 });
    
    if (response.data.status === 'healthy') {
      statusBarItem.text = "$(check) AI Review: Ready";
      
      // Check AI capabilities
      const configResponse = await axios.get(`${serverUrl}/config`);
      const aiEnabled = configResponse.data.features?.ai_suggestions;
      
      if (aiEnabled) {
        vscode.window.showInformationMessage('AI Code Reviewer is ready with AI enhancements!');
      } else {
        vscode.window.showInformationMessage(
          'AI Code Reviewer is ready. Enable AI features for enhanced suggestions.',
          'Setup AI'
        ).then(selection => {
          if (selection === 'Setup AI') {
            showAISetupInstructions();
          }
        });
      }
    }
  } catch (error) {
    statusBarItem.text = "$(error) AI Review: Server Offline";
    vscode.window.showWarningMessage(
      'AI Code Reviewer server is not running.',
      'Show Setup'
    ).then(selection => {
      if (selection === 'Show Setup') {
        showServerSetupInstructions();
      }
    });
  }
}

function showServerSetupInstructions() {
  const message = `To start the AI Code Reviewer server:

1. Open terminal in the python-server directory
2. Install dependencies: pip install -r requirements.txt
3. Start server: python server.py

The server should start on http://localhost:5001`;

  vscode.window.showInformationMessage(message);
}

function showAISetupInstructions() {
  const message = `Pure Python AI Code Reviewer is ready!

✅ No API keys required
✅ Works completely offline  
✅ Zero cost operation
✅ Lightning fast responses
✅ Privacy-focused (code never leaves your machine)

Features available:
🐍 Intelligent code completions
🔍 Bug prediction and prevention
⚡ Performance optimization suggestions
🛡️ Security vulnerability detection
📊 Code quality assessment
🎯 Design pattern recognition

Your AI Code Reviewer is powered by advanced pattern matching and rule-based intelligence!`;

  vscode.window.showInformationMessage(message);
}

class AIInlineCompletionProvider implements vscode.InlineCompletionItemProvider {
  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.InlineCompletionItem[]> {
    try {
      const config = vscode.workspace.getConfiguration('aiCodeReviewer');
      const serverUrl = config.get<string>('serverUrl', 'http://localhost:5001');

      const code = document.getText();
      const currentLine = document.lineAt(position.line).text;
      const linePrefix = currentLine.substring(0, position.character);
      
      // Only provide inline completions for meaningful contexts
      if (linePrefix.trim().length < 3) {
        return [];
      }

      // Check if we're in a comment or string
      const isInComment = linePrefix.includes('#');
      const isInString = (linePrefix.match(/"/g) || []).length % 2 === 1 || 
                        (linePrefix.match(/'/g) || []).length % 2 === 1;

      // Try Pure Python AI endpoint first for ultra-fast suggestions
      try {
        const pureResponse = await axios.post(`${serverUrl}/pure-suggest`, {
          code,
          cursor_line: position.line + 1,
          cursor_column: position.character,
          context: getContextAroundPosition(document, position),
          inline: true
        }, {
          timeout: 1000,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (pureResponse.data.status === 'success' && pureResponse.data.suggestions.length > 0) {
          const suggestions = pureResponse.data.suggestions as AISuggestion[];
          
          return suggestions.slice(0, 1).map(suggestion => {
            // Create inline completion item
            const item = new vscode.InlineCompletionItem(
              suggestion.completion,
              new vscode.Range(position, position)
            );
            
            // Add command to show explanation
            item.command = {
              command: 'aiCodeReviewer.showSuggestionExplanation',
              title: 'Show Pure Python AI Explanation',
              arguments: [suggestion.explanation, suggestion.confidence]
            };
            
            return item;
          });
        }
      } catch (error) {
        // Silently fail for inline completions
      }

    } catch (error) {
      // Silently fail
    }

    return [];
  }
}

class AICompletionProvider implements vscode.CompletionItemProvider {
  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): Promise<vscode.CompletionItem[]> {
    try {
      const config = vscode.workspace.getConfiguration('aiCodeReviewer');
      const serverUrl = config.get<string>('serverUrl', 'http://localhost:5001');

      const code = document.getText();
      const linePrefix = document.lineAt(position).text.substr(0, position.character);
      
      // Only trigger on certain contexts
      if (linePrefix.trim().length < 2 && context.triggerKind !== vscode.CompletionTriggerKind.Invoke) {
        return [];
      }

      // Try Pure Python AI endpoint first for ultra-fast suggestions
      try {
        const pureResponse = await axios.post(`${serverUrl}/pure-suggest`, {
          code,
          cursor_line: position.line + 1,
          cursor_column: position.character,
          context: getContextAroundPosition(document, position)
        }, {
          timeout: 1000,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (pureResponse.data.status === 'success' && pureResponse.data.suggestions.length > 0) {
          const suggestions = pureResponse.data.suggestions as AISuggestion[];
          
          return suggestions.map((suggestion, index) => {
            const item = new vscode.CompletionItem(
              suggestion.completion,
              vscode.CompletionItemKind.Text
            );
            item.detail = `🐍 Pure Python AI (${Math.round(suggestion.confidence * 100)}%)`;
            item.documentation = new vscode.MarkdownString(suggestion.explanation);
            item.sortText = `0${index}`; // Prioritize Pure Python AI suggestions
            item.insertText = suggestion.completion;
            
            // Add icon to distinguish AI suggestions
            item.kind = vscode.CompletionItemKind.Snippet;
            
            return item;
          });
        }
      } catch (pureError) {
        // Silently fall back to regular endpoint
      }
      
      // Fallback to regular suggestion endpoint
      const response = await axios.post(`${serverUrl}/suggest`, {
        code,
        cursor_line: position.line + 1,
        cursor_column: position.character
      }, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        const suggestions = response.data.suggestions as AISuggestion[];
        
        return suggestions.map((suggestion, index) => {
          const item = new vscode.CompletionItem(
            suggestion.completion,
            vscode.CompletionItemKind.Text
          );
          item.detail = `🤖 AI Suggestion (${Math.round(suggestion.confidence * 100)}%)`;
          item.documentation = new vscode.MarkdownString(suggestion.explanation);
          item.sortText = `1${index}`; // Lower priority than Groq
          item.insertText = suggestion.completion;
          
          return item;
        });
      }
    } catch (error) {
      // Silently fail for completions
    }

    return [];
  }
}

class EnhancedCodeActionProvider implements vscode.CodeActionProvider {
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];

    for (const diagnostic of context.diagnostics) {
      if (diagnostic.source?.startsWith('ai-review:')) {
        // Quick fix action
        const quickFix = this.createQuickFix(document, diagnostic);
        if (quickFix) {
          actions.push(quickFix);
        }

        // Refactor action for certain issues
        const refactor = this.createRefactorAction(document, diagnostic);
        if (refactor) {
          actions.push(refactor);
        }
      }
    }

    return actions;
  }

  private createQuickFix(document: vscode.TextDocument, diagnostic: vscode.Diagnostic): vscode.CodeAction | undefined {
    const suggestion = diagnostic.relatedInformation?.[0]?.message;
    if (!suggestion || !suggestion.startsWith('Suggestion: ')) {
      return undefined;
    }

    const suggestionText = suggestion.replace('Suggestion: ', '');
    const action = new vscode.CodeAction(`Fix: ${suggestionText}`, vscode.CodeActionKind.QuickFix);
    
    action.diagnostics = [diagnostic];
    action.edit = new vscode.WorkspaceEdit();
    
    // Enhanced fix logic based on diagnostic type
    if (diagnostic.code === 'CUSTOM002') {
      // Replace print with logging
      const line = document.lineAt(diagnostic.range.start.line);
      const newText = line.text.replace('print(', 'logging.info(');
      action.edit.replace(document.uri, line.range, newText);
    } else {
      // Generic replacement
      action.edit.replace(document.uri, diagnostic.range, suggestionText);
    }
    
    return action;
  }

  private createRefactorAction(document: vscode.TextDocument, diagnostic: vscode.Diagnostic): vscode.CodeAction | undefined {
    if (diagnostic.code === 'AST002') {
      // Function has too many parameters - suggest refactoring
      const action = new vscode.CodeAction(
        'Refactor: Extract parameters to class',
        vscode.CodeActionKind.RefactorRewrite
      );
      
      action.diagnostics = [diagnostic];
      // Implementation would analyze function and suggest class structure
      
      return action;
    }

    return undefined;
  }
}

class AIHoverProvider implements vscode.HoverProvider {
  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.Hover | undefined> {
    // Get diagnostics at current position
    const diagnostics = diagnosticCollection.get(document.uri);
    if (!diagnostics) return undefined;

    const relevantDiagnostics = diagnostics.filter(d => d.range.contains(position));
    if (relevantDiagnostics.length === 0) return undefined;

    const diagnostic = relevantDiagnostics[0];
    
    const markdown = new vscode.MarkdownString();
    markdown.appendMarkdown(`**${diagnostic.source}**: ${diagnostic.message}\n\n`);
    
    if (diagnostic.relatedInformation && diagnostic.relatedInformation.length > 0) {
      markdown.appendMarkdown(`💡 ${diagnostic.relatedInformation[0].message}`);
    }

    return new vscode.Hover(markdown, diagnostic.range);
  }
}

export function deactivate() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  if (suggestionTimer) {
    clearTimeout(suggestionTimer);
  }
}