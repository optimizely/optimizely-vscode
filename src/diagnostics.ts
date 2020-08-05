import * as vscode from 'vscode';
import { OptimizelyService } from './optimizelyService';
import { OP_MODE_JS, OP_MODE_TS } from './providers';

let activeEditor = vscode.window.activeTextEditor;
let diagnosticCollection: vscode.DiagnosticCollection;

export function activateDiagnostics(ctx: vscode.ExtensionContext, optimizelyService: OptimizelyService): void {
	diagnosticCollection = vscode.languages.createDiagnosticCollection();
	ctx.subscriptions.push(diagnosticCollection);
	ctx.subscriptions.push(
		vscode.workspace.onDidOpenTextDocument((document) => {
			if (document.languageId === OP_MODE_TS.language || document.languageId === OP_MODE_JS.language) {
				updateDiagnostics(optimizelyService);
			}
			return;
		}),
	);
	// ctx.subscriptions.push(
	// 	vscode.window.onDidChangeActiveTextEditor((editor) => {
	// 		debugger;
	// 		activeEditor = editor;
	// 		if (editor) {
	// 			updateDiagnostics(optimizelyService);
	// 		}
	// 	}),
	// );
	ctx.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument((event) => {
			if (activeEditor && event.document === activeEditor.document) {
				updateDiagnostics(optimizelyService);
			}
		}),
	);
}

export function updateDiagnostics(optimizelyService: OptimizelyService): void {
	if (optimizelyService === null || !activeEditor || !optimizelyService.getProjectId()) {
		return;
	}
	diagnosticCollection.clear();
	const regExArray = [
		/.*\.getFeatureVariableString\([\'\"][a-zA-Z0-9\_\-]+[\',\"]/g,
		/.*\.getFeatureVariableInteger\([\'\"][a-zA-Z0-9\_\-]+[\',\"]/g,
		/.*\.getFeatureVariableBoolean\([\'\"][a-zA-Z0-9\_\-]+[\',\"]/g,
		/.*\.getFeatureVariableDouble\([\'\"][a-zA-Z0-9\_\-]+[\',\"]/g,
		/.*\.getFeatureVariableJSON\([\'\"][a-zA-Z0-9\_\-]+[\',\"]/g,
		/.*\.activate\([\'\"][a-zA-Z0-9\_\-]+[\',\"]/g,
		/.*\.isFeatureEnabled\([\'\"][a-zA-Z0-9\_\-]+[\',\"]/g,
		/.*\.getFeatureVariable\([\'\"][a-zA-Z0-9\_\-]+[\',\"]/g,
	];
	const text = activeEditor.document.getText();
	let match;
	let diagnostics: vscode.Diagnostic[] = [];
	const featureFlags = optimizelyService.getFlags();
	for (let regEx of regExArray) {
		while ((match = regEx.exec(text))) {
			let featureKey = match[0].match(/'([^']+)'/)[1];
			if (featureKey === null) {
				// TODO: fix case with double quotes;
				featureKey = match[0].match(/"([^"]+)"/)[1];
			}
			if (featureFlags.indexOf(featureKey) === -1) {
				let startPos = activeEditor.document.positionAt(
					match.index + match[0].lastIndexOf(featureKey),
				);
				let endPos = activeEditor.document.positionAt(match.index + match[0].length - 1);
				let range = new vscode.Range(startPos, endPos);
				diagnostics.push(
					new vscode.Diagnostic(
						range,
						`Feature key ${featureKey} is not in datafile`,
						vscode.DiagnosticSeverity.Error,
					),
				);
			}
		}
	}
	diagnosticCollection.set(activeEditor.document.uri, diagnostics);
}
