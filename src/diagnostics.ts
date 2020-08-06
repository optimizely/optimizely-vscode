import * as vscode from 'vscode';
import { OptimizelyService } from './optimizelyService';
import { OP_MODE_JS, OP_MODE_TS } from './providers';

const REGEX = /.*\.(getFeatureVariable|getFeatureVariableDouble|getFeatureVariableInteger|getFeatureVariableString|getFeatureVariableBoolean|getFeatureVariableJSON|activate|getAllFeatureVariables|isFeatureEnabled)\([\'\"][a-zA-Z0-9\_\-]+[\',\"]/g;

let activeEditor = vscode.window.activeTextEditor;
let diagnosticCollection: vscode.DiagnosticCollection;

export function activateDiagnostics(ctx: vscode.ExtensionContext, optimizelyService: OptimizelyService): void {
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
			if (editor) {
				updateDiagnostics(optimizelyService, activeEditor.document);
			}
		}),
	);
	ctx.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument((event) => {
			if (activeEditor && event.document === activeEditor.document) {
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
	while (match = REGEX.exec(text)) {
		let featureMatch = match[0].match(/'([^']+)'/);
		if (featureMatch === null) {
			featureMatch = match[0].match(/"([^"]+)"/);
		}
		let featureKey = featureMatch[1];
		if (featureFlags.indexOf(featureKey) === -1) {
			let startPos = document.positionAt(
				match.index + match[0].lastIndexOf(featureKey),
			);
			let endPos = document.positionAt(match.index + match[0].length - 1);
			let range = new vscode.Range(startPos, endPos);
			diagnostics.push(
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
