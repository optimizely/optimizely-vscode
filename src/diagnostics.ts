import * as vscode from 'vscode';
import { OptimizelyService } from './optimizelyService';
import { OP_MODE_JS, OP_MODE_TS } from './providers';

const REGEX = /.*\.(getFeatureVariable|getFeatureVariableDouble|getFeatureVariableInteger|getFeatureVariableString|getFeatureVariableBoolean|getFeatureVariableJSON|getAllFeatureVariables|isFeatureEnabled)\([\s\n\r]{0,}[\'\"](.*?)[\',\"]+/g;
const COMMENTS_REGEX = /[//|*|].*/;
let activeEditor = vscode.window.activeTextEditor;
let diagnosticCollection: vscode.DiagnosticCollection;

export function activateDiagnostics(ctx: vscode.ExtensionContext, optimizelyService: OptimizelyService): void {
  //creating instace of DiagnosticCollection that manages a set of diagnostics
  diagnosticCollection = vscode.languages.createDiagnosticCollection();
  ctx.subscriptions.push(diagnosticCollection);
  ctx.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((document) => {
      if (document.languageId === OP_MODE_TS.language || document.languageId === OP_MODE_JS.language) {
        updateDiagnostics(optimizelyService, document);
      }
      return;
    }),
  );
  ctx.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      activeEditor = editor;
      if (editor && (activeEditor.document.languageId === OP_MODE_TS.language || activeEditor.document.languageId === OP_MODE_JS.language)) {
        updateDiagnostics(optimizelyService, activeEditor.document);
      }
    }),
  );
  ctx.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (activeEditor && event.document === activeEditor.document && (event.document.languageId === OP_MODE_TS.language || event.document.languageId === OP_MODE_JS.language)) {
        updateDiagnostics(optimizelyService, event.document);
      }
    }),
  );
}

export function updateDiagnostics(optimizelyService: OptimizelyService, document: vscode.TextDocument): void {
  if (optimizelyService === null || !optimizelyService.getProjectId()) {
    return;
  }
  diagnosticCollection.clear();
  const featureFlags = optimizelyService.getFlags();
  const text = document.getText();
  let match;
  let diagnostics: vscode.Diagnostic[] = [];
  // eslint-disable-next-line
  while (match = REGEX.exec(text)) {
    let matchString = match[0];
    let parsableString = matchString;
    let commentMatchIndex = matchString.match(COMMENTS_REGEX)?.index;
    if (commentMatchIndex != -1) {
      parsableString = matchString.substring(0, commentMatchIndex);
    }
    let featureMatch = parsableString.match(/'([^']+)'/);
    if (featureMatch === null) {
      featureMatch = parsableString.match(/"([^"]+)"/);
    }
    if (featureMatch === null) {
      continue;
    }
    let featureKey = featureMatch[1];
    if (featureFlags.indexOf(featureKey) === -1) {
      let startPos = document.positionAt(
        match.index + parsableString.lastIndexOf(featureKey),
      );
      let endPos = document.positionAt(match.index + parsableString.lastIndexOf(featureKey) + featureKey.length);
      let range = new vscode.Range(startPos, endPos);
      diagnostics.push(
        //object representing a compiler warning
        new vscode.Diagnostic(
          range,
          `Feature key ${featureKey} is not in datafile.`,
          vscode.DiagnosticSeverity.Warning,
        ),
      );
    }

  }
  diagnosticCollection.set(document.uri, diagnostics);
}
