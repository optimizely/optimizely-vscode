/**
 * Copyright 2020, Optimizely
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as vscode from 'vscode';
import * as path from 'path';

import { ConfigurationMenu } from './configurationMenu';
import { OptimizelyService } from './optimizelyService';
import { activateDiagnostics } from './diagnostics';

export const OP_MODE_TS: vscode.DocumentFilter = {
	language: 'typescript',
	scheme: 'file',
};
export const OP_MODE_JS: vscode.DocumentFilter = {
	language: 'javascript',
	scheme: 'file',
};

const REGEX = /.*\.getFeatureVariable\([\'\"][a-zA-Z0-9\_\-]+[\',\"], ?[\'\"]$/
const REGEX_D = /.*\.getFeatureVariableDouble\([\'\"][a-zA-Z0-9\_\-]+[\',\"], ?[\'\"]$/
const REGEX_I = /.*\.getFeatureVariableInteger\([\'\"][a-zA-Z0-9\_\-]+[\',\"], ?[\'\"]$/
const REGEX_S = /.*\.getFeatureVariableString\([\'\"][a-zA-Z0-9\_\-]+[\',\"], ?[\'\"]$/
const REGEX_B = /.*\.getFeatureVariableBoolean\([\'\"][a-zA-Z0-9\_\-]+[\',\"], ?[\'\"]$/
const REGEX_J = /.*\.getFeatureVariableJSON\([\'\"][a-zA-Z0-9\_\-]+[\',\"], ?[\'\"]$/

export function register(ctx: vscode.ExtensionContext, optimizelyService: OptimizelyService) {
	ctx.subscriptions.push(
		vscode.commands.registerCommand('extension.configureOptimizely', async () => {
			try {
				const configurationMenu = new ConfigurationMenu(optimizelyService);
				await configurationMenu.configure();
				// console.log('checking if service is valid')
				// if (!optimizelyService.isValid()) {
				// 	vscode.window.showErrorMessage('An unexpected error occured, please try again later.');
				// }
				// else {
				// 	vscode.window.showInformationMessage('Optimizely configured successfully');
				// }
			} catch (err) {
				console.error(err);
				vscode.window.showErrorMessage('An unexpected error occured, please try again later.');
			}
		}),
	);

	ctx.subscriptions.push(
		vscode.languages.registerCompletionItemProvider(
			OP_MODE_TS,
			new OptimizelyCompletionItemProvider(optimizelyService),
			"'",
			'"',
		),
	);
	ctx.subscriptions.push(
		vscode.languages.registerCompletionItemProvider(
			OP_MODE_JS,
			new OptimizelyCompletionItemProvider(optimizelyService),
			"'",
			'"',
		),
	);

	ctx.subscriptions.push(
		vscode.commands.registerTextEditorCommand('extension.openInOptimizely', async editor => {
			console.log('inside open in optimizely')
			let selection = editor.selection;
			let word = editor.document.getText(selection);
			if (!word) {
				vscode.window.showErrorMessage(
					'[Optimizely] Error retrieving keyword (current cursor position is not a feature flag or experiment).',
				);
				return;
			}

			if (!optimizelyService.isValid()) {
				vscode.window.showErrorMessage('[Optimizely] sdkKey is not set.');
				return;
			}

			let linePrefix = editor.document.lineAt(selection.anchor).text.substring(0, selection.anchor.character);

			var method = openFlagInBrowser;

			if (isExperimentApi(linePrefix)) {
				method = openExperimentInBrowser;
			}

			try {
				await method(word, optimizelyService);
			} catch (err) {
				let errMsg = `Encountered an unexpected error opening ${word}`;
				console.error(err);
				vscode.window.showErrorMessage(`[Optimizely] ${errMsg}`);
			}
		}),
	);
	ctx.subscriptions.push(
		vscode.commands.registerTextEditorCommand('extension.listVariations', async editor => {
			let selection = editor.selection;
			let word = editor.document.getText(selection);
			if (!word) {
				vscode.window.showErrorMessage(
					'[Optimizely] Error retrieving keyword (current cursor position is not a feature flag or experiment).',
				);
				return;
			}

			var list = []
			try {
				if (optimizelyService.getFeatureFlag(word) != null) {
					list = optimizelyService.allFeatureVariables(word, 'all')
				}
				else if (optimizelyService.getExperiment(word) != null){
					list = optimizelyService.allExperimentVariables(word)
				}
				else {
					vscode.window.showErrorMessage(
						'[Optimizely] Error retrieving keyword (current cursor position is not a feature flag or experiment).',
					);	
				}
			} catch (err) {
				let errMsg = `Encountered an unexpected error opening ${word}`;
				console.error(err);
				vscode.window.showErrorMessage(`[Optimizely] ${errMsg}`);
			}
			let event = await vscode.window.showQuickPick(list)
			editor.edit(eb => eb.replace(selection, event))			

		}),
	);
	ctx.subscriptions.push(
		vscode.commands.registerTextEditorCommand('extension.listEvents', async editor => {

			if (!optimizelyService.isValid()) {
				vscode.window.showErrorMessage('[Optimizely] is not initialized correctly. Set SDK Key');
			}
			else {
				const events = optimizelyService.getEvents()
				let event = await vscode.window.showQuickPick(events)
				// check if there is no selection
				if (editor.selection.isEmpty) {
					// the Position object gives you the line and character where the cursor is
					const position = editor.selection.active;
					editor.edit(eb => eb.insert(position, event))
				}			
			}
		}),
	);
	ctx.subscriptions.push(
		vscode.commands.registerTextEditorCommand('extension.listAttributes', async editor => {

			if (!optimizelyService.isValid()) {
				vscode.window.showErrorMessage('[Optimizely] is not initialized correctly. Set SDK Key');
			}
			else {
				const attriutes = optimizelyService.getAttributes()
				let attr = await vscode.window.showQuickPick(attriutes)
				// check if there is no selection
				if (editor.selection.isEmpty) {
					// the Position object gives you the line and character where the cursor is
					const position = editor.selection.active;
					editor.edit(eb => eb.insert(position, attr))
				}			
			}
		}),
	);
	ctx.subscriptions.push(
		vscode.commands.registerTextEditorCommand('extension.listFeatures', async editor => {

			if (!optimizelyService.isValid()) {
				vscode.window.showErrorMessage('[Optimizely] is not initialized correctly. Set SDK Key');
			}
			else {
				const flags = optimizelyService.allFlags()
				let flg = await vscode.window.showQuickPick(flags)
				// check if there is no selection
				if (editor.selection.isEmpty) {
					// the Position object gives you the line and character where the cursor is
					const position = editor.selection.active;
					editor.edit(eb => eb.insert(position, flg))
				}			
			}
		}),
	);
	ctx.subscriptions.push(
		vscode.commands.registerTextEditorCommand('extension.listExperiments', async editor => {

			if (!optimizelyService.isValid()) {
				vscode.window.showErrorMessage('[Optimizely] is not initialized correctly. Set SDK Key');
			}
			else {
				const experiments = optimizelyService.allExperiments()
				let experiment = await vscode.window.showQuickPick(experiments)
				// check if there is no selection
				if (editor.selection.isEmpty) {
					// the Position object gives you the line and character where the cursor is
					const position = editor.selection.active;
					editor.edit(eb => eb.insert(position, experiment))
				}			
			}
		}),
	);
	ctx.subscriptions.push(
		vscode.commands.registerCommand('extension.showDebugDialog', async () => {

			if (!optimizelyService.isValid()) {
				vscode.window.showErrorMessage('[Optimizely] is not initialized correctly. Set SDK Key');
			}
			else {
				const panel = vscode.window.createWebviewPanel(
					'optimizelyDD',
					'Optimizely Debug Dialog',
					vscode.ViewColumn.One,
					{
						// Enable scripts in the webview
						enableScripts: true
					})

				const onDiskPath = vscode.Uri.file(
					path.join(ctx.extensionPath, "debugdialog.html")
				);

				const fp = onDiskPath.toString() + "?sdk_key=" + optimizelyService.getActiveSdkKey()

				vscode.workspace.openTextDocument(onDiskPath).then((document) => {
					let text = document.getText();
					text = text.replace('var href = window.location.href', `var href = '${fp}'`)
					panel.webview.html = text;
				  });
			}
		}),
	);
	activateDiagnostics(ctx, optimizelyService);
}

class OptimizelyCompletionItemProvider implements vscode.CompletionItemProvider {
	private readonly optimizelyService: OptimizelyService;

	constructor(optimizelyService: OptimizelyService) {
		this.optimizelyService = optimizelyService;
	}

	public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position): vscode.CompletionItem[] {

		if (this.optimizelyService == null) {
			console.log("optimizelyService is null")
			return undefined;
		}
		let linePrefix = document.lineAt(position).text.substring(0, position.character);
	
		if (isExperimentApi(linePrefix)) {
			const exp:string[] = this.optimizelyService.allExperiments();
			
			return exp.map(flag => {
					return new vscode.CompletionItem(flag, vscode.CompletionItemKind.Field);
				});
	
		}
		if (isFeatureApi(linePrefix)) {
			const flags:string[] = this.optimizelyService.allFlags();
			
			return flags.map(flag => {
					return new vscode.CompletionItem(flag, vscode.CompletionItemKind.Field);
				});
		}

		if (linePrefix.match(REGEX) != null) {
			var matchString = 'getFeatureVariable(\''
			var matchDelim = '\''
			if (linePrefix.lastIndexOf(matchString) < 0) {
				matchString = 'getFeatureVariable(\"'
				matchDelim = '\"'
			}
			let start = linePrefix.lastIndexOf(matchString) + matchString.length
			let end = linePrefix.indexOf(matchDelim, start)
			let featureKey = linePrefix.substring(start, end)
			const variables:string[] = this.optimizelyService.allFeatureVariables(featureKey, 'all');
			return variables.map(flag => {
					return new vscode.CompletionItem(flag, vscode.CompletionItemKind.Field);
				});
		}

		if (linePrefix.match(REGEX_D) != null) {
			var matchString = 'getFeatureVariableDouble(\''
			var matchDelim = '\''
			if (linePrefix.lastIndexOf(matchString) < 0) {
				matchString = 'getFeatureVariableDouble(\"'
				matchDelim = '\"'
			}
			let start = linePrefix.lastIndexOf(matchString) + matchString.length
			let end = linePrefix.indexOf(matchDelim, start)
			let featureKey = linePrefix.substring(start, end)
			const variables:string[] = this.optimizelyService.allFeatureVariables(featureKey, 'double');
			return variables.map(flag => {
					return new vscode.CompletionItem(flag, vscode.CompletionItemKind.Field);
				});
		}

		if (linePrefix.match(REGEX_I) != null) {
			var matchString = 'getFeatureVariableInteger(\''
			var matchDelim = '\''
			if (linePrefix.lastIndexOf(matchString) < 0) {
				matchString = 'getFeatureVariableInteger(\"'
				matchDelim = '\"'
			}
			let start = linePrefix.lastIndexOf(matchString) + matchString.length
			let end = linePrefix.indexOf(matchDelim, start)
			let featureKey = linePrefix.substring(start, end)
			const variables:string[] = this.optimizelyService.allFeatureVariables(featureKey, 'integer');
			return variables.map(flag => {
					return new vscode.CompletionItem(flag, vscode.CompletionItemKind.Field);
				});
		}

		if (linePrefix.match(REGEX_S) != null) {
			var matchString = 'getFeatureVariableString(\''
			var matchDelim = '\''
			if (linePrefix.lastIndexOf(matchString) < 0) {
				matchString = 'getFeatureVariableString(\"'
				matchDelim = '\"'
			}
			let start = linePrefix.lastIndexOf(matchString) + matchString.length
			let end = linePrefix.indexOf(matchDelim, start)
			let featureKey = linePrefix.substring(start, end)
			const variables:string[] = this.optimizelyService.allFeatureVariables(featureKey, 'string');
			return variables.map(flag => {
					return new vscode.CompletionItem(flag, vscode.CompletionItemKind.Field);
				});
		}

		if (linePrefix.match(REGEX_B) != null) {
			var matchString = 'getFeatureVariableBoolean(\''
			var matchDelim = '\''
			if (linePrefix.lastIndexOf(matchString) < 0) {
				matchString = 'getFeatureVariableBoolean(\"'
				matchDelim = '\"'
			}
			let start = linePrefix.lastIndexOf(matchString) + matchString.length
			let end = linePrefix.indexOf(matchDelim, start)
			let featureKey = linePrefix.substring(start, end)
			const variables:string[] = this.optimizelyService.allFeatureVariables(featureKey, 'boolean');
			return variables.map(flag => {
					return new vscode.CompletionItem(flag, vscode.CompletionItemKind.Field);
				});
		}

		if (linePrefix.match(REGEX_J) != null) {
			var matchString = 'getFeatureVariableJSON(\''
			var matchDelim = '\''
			if (linePrefix.lastIndexOf(matchString) < 0) {
				matchString = 'getFeatureVariableJSON(\"'
				matchDelim = '\"'
			}
			let start = linePrefix.lastIndexOf(matchString) + matchString.length
			let end = linePrefix.indexOf(matchDelim, start)
			let featureKey = linePrefix.substring(start, end)
			const variables:string[] = this.optimizelyService.allFeatureVariables(featureKey, 'json');
			return variables.map(flag => {
					return new vscode.CompletionItem(flag, vscode.CompletionItemKind.Field);
				});
		}

		return undefined;
	}
}

const isExperimentApi = (linePrefix:string): boolean => {
	return (linePrefix.endsWith('activate(\'') 
	|| linePrefix.endsWith('activate(\"')
	|| linePrefix.endsWith('getVariation(\'')
	|| linePrefix.endsWith('getVariation(\"')
	|| linePrefix.endsWith('<OptimizelyExperiment experiment=\"')
	|| linePrefix.endsWith('<OptimizelyExperiment experiment=\'')
	)	
}
const isFeatureApi = (linePrefix:string): boolean => {
	return (linePrefix.endsWith('isFeatureEnabled(\'') 
	|| linePrefix.endsWith('isFeatureEnabled(\"')
	|| linePrefix.endsWith('getFeatureVariable(\'')
	|| linePrefix.endsWith('getFeatureVariable(\"')
	|| linePrefix.endsWith('getFeatureVariableDouble(\'')
	|| linePrefix.endsWith('getFeatureVariableDouble(\"')
	|| linePrefix.endsWith('getFeatureVariableInteger(\'')
	|| linePrefix.endsWith('getFeatureVariableInteger(\"')
	|| linePrefix.endsWith('getFeatureVariableString(\'')
	|| linePrefix.endsWith('getFeatureVariableString(\"')
	|| linePrefix.endsWith('getFeatureVariableBoolean(\'')
	|| linePrefix.endsWith('getFeatureVariableBoolean(\"')
	|| linePrefix.endsWith('getFeatureVariableJSON(\'')
	|| linePrefix.endsWith('getFeatureVariableJSON(\"')
	|| linePrefix.endsWith('<OptimizelyFeature feature=\"')
	|| linePrefix.endsWith('<OptimizelyFeature feature=\'')
	)	
}

const openFlagInBrowser = async (flagKey: string, optimizelyService: OptimizelyService) => {
	const flag =  optimizelyService.getFeatureFlag(flagKey);

	if (flag != null) {
		return vscode.env.openExternal(vscode.Uri.parse(optimizelyService.getFlagPath(flag)));
	}
};

const openExperimentInBrowser = async (key: string, optimizelyService: OptimizelyService) => {
	const experiment = optimizelyService.getExperiment(key);

	return vscode.env.openExternal(vscode.Uri.parse(optimizelyService.getExperimentPath(experiment)));
};

export function getFeatureRegEx(reg:string): RegExp {
	if (reg == 'getFeatureVariable') {
		return REGEX
	}
	if (reg == 'getFeatureVariableString') {
		return REGEX_S
	}
	if (reg == 'getFeatureVariableBoolean') {
		return REGEX_B
	}
	if (reg == 'getFeatureVariableInteger') {
		return REGEX_I
	}
	if (reg == 'getFeatureVariableDouble') {
		return REGEX_D
	}
	if (reg == 'getFeatureVariableJSON') {
		return REGEX_J
	}

	return REGEX
}
