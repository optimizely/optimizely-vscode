import * as vscode from 'vscode';

import { ConfigurationMenu } from './configurationMenu';
import { OptimizelyService } from './optimizelyService';

const REGEX = /.*\.getFeatureVariable\([\'\"].*[\',\"], ?[\'\"]/
const REGEX_D = /.*\.getFeatureVariableDouble\([\'\"].*[\',\"], ?[\'\"]/
const REGEX_I = /.*\.getFeatureVariableInteger\([\'\"].*[\',\"], ?[\'\"]/
const REGEX_S = /.*\.getFeatureVariableString\([\'\"].*[\',\"], ?[\'\"]/
const REGEX_B = /.*\.getFeatureVariableBoolean\([\'\"].*[\',\"], ?[\'\"]/
const OP_MODE_TS: vscode.DocumentFilter = {
	language: 'typescript',
	scheme: 'file',
};
const OP_MODE_JS: vscode.DocumentFilter = {
	language: 'javascript',
	scheme: 'file',
};

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

			console.log(linePrefix);

			if (linePrefix.endsWith('activate(\'') 
			|| linePrefix.endsWith('activate(\"')
			|| linePrefix.endsWith('getVariation(\'')
			|| linePrefix.endsWith('getVariation(\"')) {
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
			console.log('inside list variations')

			if (!optimizelyService.isValid()) {
				vscode.window.showErrorMessage('[Optimizely] is not initialized correctly. Set SDK Key');
			}
		}),
	);
}

class OptimizelyCompletionItemProvider implements vscode.CompletionItemProvider {
	private readonly optimizelyService: OptimizelyService;

	constructor(optimizelyService: OptimizelyService) {
		this.optimizelyService = optimizelyService;
	}

	public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position): vscode.CompletionItem[] {
		console.log("inside completions");
		if (this.optimizelyService == null) {
			console.log("optimizelyService is null")
			return undefined;
		}
		let linePrefix = document.lineAt(position).text.substring(0, position.character);
		if (linePrefix.endsWith('activate(\'') 
		|| linePrefix.endsWith('activate(\"')
		|| linePrefix.endsWith('getVariation(\'')
		|| linePrefix.endsWith('getVariation(\"')
		) {
			const exp:string[] = this.optimizelyService.allExperiments();
			console.log(exp);
			return exp.map(flag => {
					return new vscode.CompletionItem(flag, vscode.CompletionItemKind.Field);
				});
	
		}
		if (linePrefix.endsWith('isFeatureEnabled(\'') 
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
		) {
			const flags:string[] = this.optimizelyService.allFlags();
			console.log(flags);
			return flags.map(flag => {
					return new vscode.CompletionItem(flag, vscode.CompletionItemKind.Field);
				});
		}

		if (linePrefix.match(REGEX) != null) {
			console.log('got a match')
			var matchString = 'getFeatureVariable(\''
			var matchDelim = '\''
			if (linePrefix.lastIndexOf(matchString) < 0) {
				matchString = 'getFeatureVariable(\"'
				matchDelim = '\"'
			}
			let start = linePrefix.lastIndexOf(matchString) + matchString.length
			let end = linePrefix.indexOf(matchDelim, start)
			let featureKey = linePrefix.substring(start, end)
			console.log(featureKey)
			const variables:string[] = this.optimizelyService.allFeatureVariables(featureKey, 'all');
			console.log(variables);
			return variables.map(flag => {
					return new vscode.CompletionItem(flag, vscode.CompletionItemKind.Field);
				});
		}

		if (linePrefix.match(REGEX_D) != null) {
			console.log('got a match')
			var matchString = 'getFeatureVariableDouble(\''
			var matchDelim = '\''
			if (linePrefix.lastIndexOf(matchString) < 0) {
				matchString = 'getFeatureVariableDouble(\"'
				matchDelim = '\"'
			}
			let start = linePrefix.lastIndexOf(matchString) + matchString.length
			let end = linePrefix.indexOf(matchDelim, start)
			let featureKey = linePrefix.substring(start, end)
			console.log(featureKey)
			const variables:string[] = this.optimizelyService.allFeatureVariables(featureKey, 'double');
			console.log(variables);
			return variables.map(flag => {
					return new vscode.CompletionItem(flag, vscode.CompletionItemKind.Field);
				});
		}

		if (linePrefix.match(REGEX_I) != null) {
			console.log('got a match')
			var matchString = 'getFeatureVariableInteger(\''
			var matchDelim = '\''
			if (linePrefix.lastIndexOf(matchString) < 0) {
				matchString = 'getFeatureVariableInteger(\"'
				matchDelim = '\"'
			}
			let start = linePrefix.lastIndexOf(matchString) + matchString.length
			let end = linePrefix.indexOf(matchDelim, start)
			let featureKey = linePrefix.substring(start, end)
			console.log(featureKey)
			const variables:string[] = this.optimizelyService.allFeatureVariables(featureKey, 'integer');
			console.log(variables);
			return variables.map(flag => {
					return new vscode.CompletionItem(flag, vscode.CompletionItemKind.Field);
				});
		}

		if (linePrefix.match(REGEX_S) != null) {
			console.log('got a match')
			var matchString = 'getFeatureVariableString(\''
			var matchDelim = '\''
			if (linePrefix.lastIndexOf(matchString) < 0) {
				matchString = 'getFeatureVariableString(\"'
				matchDelim = '\"'
			}
			let start = linePrefix.lastIndexOf(matchString) + matchString.length
			let end = linePrefix.indexOf(matchDelim, start)
			let featureKey = linePrefix.substring(start, end)
			console.log(featureKey)
			const variables:string[] = this.optimizelyService.allFeatureVariables(featureKey, 'string');
			console.log(variables);
			return variables.map(flag => {
					return new vscode.CompletionItem(flag, vscode.CompletionItemKind.Field);
				});
		}

		if (linePrefix.match(REGEX_B) != null) {
			console.log('got a match')
			var matchString = 'getFeatureVariableBoolean(\''
			var matchDelim = '\''
			if (linePrefix.lastIndexOf(matchString) < 0) {
				matchString = 'getFeatureVariableBoolean(\"'
				matchDelim = '\"'
			}
			let start = linePrefix.lastIndexOf(matchString) + matchString.length
			let end = linePrefix.indexOf(matchDelim, start)
			let featureKey = linePrefix.substring(start, end)
			console.log(featureKey)
			const variables:string[] = this.optimizelyService.allFeatureVariables(featureKey, 'boolean');
			console.log(variables);
			return variables.map(flag => {
					return new vscode.CompletionItem(flag, vscode.CompletionItemKind.Field);
				});
		}

		return undefined;
	}
}

const openFlagInBrowser = async (flagKey: string, optimizelyService: OptimizelyService) => {
	const flag =  optimizelyService.getFeatureFlag(flagKey);

	if (flag != null) {
		return vscode.env.openExternal(vscode.Uri.parse(optimizelyService.getFlagPath(flag)));
	}
};

const openExperimentInBrowser = async (flagKey: string, optimizelyService: OptimizelyService) => {
	const { flag } = await optimizelyService.getExperiment(flagKey);

	return vscode.env.openExternal(vscode.Uri.parse(optimizelyService.getExperimentPath(flag)));
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

	return REGEX
}