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
