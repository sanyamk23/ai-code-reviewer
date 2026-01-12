import * as vscode from 'vscode';
import { EmbeddedPythonAnalyzer } from './pythonAnalyzer';

interface Finding {
  id: string;
  source: string;
  severity: 'error' | 'warning' | 'info' | 'suggestion';
  message: string;
  line: number;
  column?: number;
  suggestion?: string;
  category?: string;
}

let diagnosticCollection: vscode.DiagnosticCollection;
let debounceTimer: NodeJS.Timeout | undefined;
let statusBarItem: vscode.StatusBarItem;
let outputChannel: vscode.OutputChannel;
let embeddedAnalyzer: EmbeddedPythonAnalyzer;

export function activate(context: vscode.ExtensionContext) {
  console.log('Pure Python AI Code Reviewer extension is now active');

  // Initialize embedded analyzer (no server required!)
  try {
    embeddedAnalyzer = new EmbeddedPythonAnalyzer();
    console.log('✅ Embedded Python analyzer initialized - no server required!');
  } catch (error) {
    console.error('❌ Failed to initialize analyzer:', error);
    vscode.window.showErrorMessage(`Failed to initialize Pure Python AI: ${error}`);
    return;
  }

  // Create output channel for logging
  outputChannel = vscode.window.createOutputChannel('Pure Python AI Code Reviewer');
  context.subscriptions.push(outputChannel);
  
  // Log to output channel
  outputChannel.appendLine('🚀 Pure Python AI Code Reviewer activated successfully!');
  outputChannel.appendLine('✅ Embedded analyzer ready - no server required');
  outputChannel.show();

  // Create status bar item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = "$(check) Pure Python AI: Ready";
  statusBarItem.tooltip = "Pure Python AI Code Reviewer - 100% Offline";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Create diagnostic collection
  diagnosticCollection = vscode.languages.createDiagnosticCollection('pureAiCodeReviewer');
  context.subscriptions.push(diagnosticCollection);

  // Register commands
  const testCommand = vscode.commands.registerCommand('aiCodeReviewer.test', () => {
    vscode.window.showInformationMessage('🎉 Pure Python AI Code Reviewer is working! Extension activated successfully.');
    outputChannel.appendLine('✅ Test command executed - extension is working!');
  });

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

  context.subscriptions.push(testCommand, analyzeFileCommand, analyzeWorkspaceCommand, showMetricsCommand);

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
    }
  });

  const onDidOpenDocument = vscode.workspace.onDidOpenTextDocument((document) => {
    if (isPythonFile(document)) {
      analyzeDocument(document);
    }
  });

  context.subscriptions.push(onDidSaveDocument, onDidChangeDocument, onDidOpenDocument);

  // Show welcome message
  vscode.window.showInformationMessage(
    '🐍 Pure Python AI Code Reviewer is ready! No setup required - 100% offline analysis.',
    'Got it!'
  );
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

async function analyzeDocument(document: vscode.TextDocument) {
  try {
    console.log('🔍 Starting analysis for:', document.fileName);
    outputChannel.appendLine(`🔍 Analyzing: ${document.fileName}`);
    
    statusBarItem.text = "$(sync~spin) Pure Python AI: Analyzing...";
    
    const code = document.getText();
    const filename = document.fileName;

    console.log('📝 Code length:', code.length, 'characters');
    outputChannel.appendLine(`📝 Code length: ${code.length} characters`);

    // Use embedded analyzer - no server required!
    const result = embeddedAnalyzer.analyze(code, filename);
    
    console.log('📊 Analysis result:', result);
    outputChannel.appendLine(`📊 Analysis completed: ${result.findings.length} findings`);

    if (result.status === 'success') {
      updateDiagnostics(document, result.findings);
      updateStatusBar(result);
      
      // Only log to output channel if there are significant findings
      const errorCount = result.findings.filter(f => f.severity === 'error').length;
      const warningCount = result.findings.filter(f => f.severity === 'warning').length;
      
      outputChannel.appendLine(`✅ Analysis complete: ${errorCount} errors, ${warningCount} warnings`);
      
      if (errorCount > 0 || warningCount > 0) {
        outputChannel.appendLine(`📋 Findings details:`);
        result.findings.forEach((finding, index) => {
          outputChannel.appendLine(`  ${index + 1}. Line ${finding.line}: ${finding.message}`);
        });
      }
    } else {
      console.error('❌ Analysis failed:', result.error);
      outputChannel.appendLine(`❌ Analysis failed: ${result.error}`);
      vscode.window.showErrorMessage(`Analysis failed: ${result.error}`);
      statusBarItem.text = "$(error) Pure Python AI: Error";
    }

  } catch (error) {
    console.error('Analysis error:', error);
    statusBarItem.text = "$(error) Pure Python AI: Error";
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    vscode.window.showErrorMessage(`Analysis failed: ${errorMessage}`);
  }
}

function updateDiagnostics(document: vscode.TextDocument, findings: Finding[]) {
  const diagnostics: vscode.Diagnostic[] = [];

  for (const finding of findings) {
    const line = Math.max(0, finding.line - 1);
    const column = finding.column || 0;
    
    const range = new vscode.Range(line, column, line, column + 1);
    const severity = getSeverity(finding.severity);
    
    // Create a clean message format
    let message = finding.message;
    if (finding.suggestion) {
      message += ` 💡 ${finding.suggestion}`;
    }
    
    const diagnostic = new vscode.Diagnostic(range, message, severity);
    
    // Clean source format
    diagnostic.source = `Pure Python AI (${finding.source})`;
    diagnostic.code = finding.id;
    
    // Add tags for better categorization
    if (finding.category === 'security') {
      diagnostic.tags = [vscode.DiagnosticTag.Deprecated]; // Use as security indicator
    }

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

function updateStatusBar(result: any) {
  const errorCount = result.findings.filter((f: any) => f.severity === 'error').length;
  const warningCount = result.findings.filter((f: any) => f.severity === 'warning').length;
  
  let icon = "$(check)";
  if (errorCount > 0) {
    icon = "$(error)";
  } else if (warningCount > 0) {
    icon = "$(warning)";
  }
  
  statusBarItem.text = `${icon} Pure Python AI: ${errorCount}E ${warningCount}W`;
  statusBarItem.tooltip = `Embedded Analysis - Errors: ${errorCount}, Warnings: ${warningCount} | 100% Offline`;
}

async function analyzeWorkspace() {
  const pythonFiles = await vscode.workspace.findFiles('**/*.py', '**/node_modules/**');
  
  vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: "Pure Python AI: Analyzing workspace...",
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
    
    vscode.window.showInformationMessage(`Workspace analysis complete! Analyzed ${processed} Python files with embedded AI.`);
  });
}

async function showCodeMetrics() {
  const editor = vscode.window.activeTextEditor;
  if (!editor || !isPythonFile(editor.document)) {
    vscode.window.showWarningMessage('Please open a Python file to view metrics.');
    return;
  }

  try {
    const result = embeddedAnalyzer.analyze(editor.document.getText(), editor.document.fileName);
    
    if (result.status === 'success' && result.metrics) {
      const metrics = result.metrics;
      const message = `Pure Python AI Code Metrics:
Lines of Code: ${metrics.lines_of_code}
Total Lines: ${metrics.total_lines}
Functions: ${metrics.functions}
Classes: ${metrics.classes}
Complexity Score: ${metrics.complexity_score}/10`;

      vscode.window.showInformationMessage(message);
    }
  } catch (error) {
    vscode.window.showErrorMessage('Failed to get code metrics.');
  }
}

export function deactivate() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
}