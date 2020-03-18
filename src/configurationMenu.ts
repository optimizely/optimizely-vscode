import { window } from 'vscode';

import { OptimizelyService } from './optimizelyService';

export class ConfigurationMenu {
	private readonly service: OptimizelyService;
	private currentSdkKey: string;
	private sdkKey: string;
	private invalidSdkKey: string;

	constructor(service : OptimizelyService) {
		this.service = service;
	}

	shouldResume() {
		// Required by multiStepInput
		// Could show a notification with the option to resume.
		return new Promise<boolean>(() => {});
	}

	async inputSdkKey() {
		this.sdkKey = '';
		this.sdkKey = await window.showInputBox({ prompt: 'Please enter an SDK Key.' });

		console.log("sdk key entered : " + this.sdkKey);

		try {
			await this.updateService();
		} catch (err) {
			console.log(err)
			this.invalidSdkKey = this.sdkKey;
			window.showErrorMessage('Invalid sdk key, please try again.');
		}
	}

	async validateSdkKey(token: string, invalidSdkKey: string) {
		if (token === invalidSdkKey) {
			console.log('invalid sdk key')
			return 'Invalid sdk.';
		}
	}

	didChangeSdkKey(): boolean {
		return this.sdkKey !== this.currentSdkKey;
	}

	async updateService() {
		console.log("inside update")
		await this.service.load(this.sdkKey);

	}

	async configure() {
		console.log('config');

		await this.inputSdkKey();
	}

}
