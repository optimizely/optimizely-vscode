'use strict';

import { commands, ExtensionContext } from 'vscode';

import { OptimizelyService } from './optimizelyService';
import { register as registerProviders } from './providers';

let optimizelyService: OptimizelyService;

export function activate(ctx: ExtensionContext) {

	optimizelyService = new OptimizelyService();

	//commands.executeCommand('extension.configureOptimizely')

	console.log("registering providers")
	registerProviders(ctx, optimizelyService);
}

export function deactivate() {
	console.log("deactivated extension")
	optimizelyService.stop();
}
