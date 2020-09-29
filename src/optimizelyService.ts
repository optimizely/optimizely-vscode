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

const { HttpPollingDatafileManager } = require('@optimizely/js-sdk-datafile-manager')
import { window } from 'vscode';

export class OptimizelyService {
	private readonly store: { [key: string]: any } = {};
	private activeInstance: any;
	private activeSdkKey: string;
	private projectId: string;

	constructor() {
		console.log("created ")
	}

	getActiveSdkKey(): string {
		return this.activeSdkKey
	}

	setProjectId(projectId: string) {
		this.projectId = projectId; 
	}

	getProjectId(): string {
		if (this.activeInstance != null) {
			return this.activeInstance.get().projectId;
		} 
	}

	isValid(): boolean {
		return this.activeInstance != null && this.activeInstance.get() != null;
	}

	allExperimentVariables(key: string): string[] {
		if (this.activeInstance != null) {
			const flag = this.getExperiment(key);
			if (flag != null) {
				return flag.variations.map(v => v.key)
			}
	   }

	}

	allFeatureVariables(featureKey: string, filterByType: string): string[] {
		if (this.activeInstance != null) {
			const flag = this.getFeatureFlag(featureKey);
			if (flag != null) {
				var variables = new Array<string>()
				for (let v of flag.variables) {
					if (filterByType == 'all' || filterByType == v.type) {
						variables.push(v.key)
					}
				}
				return variables;
			}
	   }

	}

	allFlags(): string[] {
		return this.getFlags();
	}

	allExperiments(): string[] {
		return this.getExperiments();
	}

	getFlagPath(flag: any): string {
		if (this.activeInstance == null) return undefined;
		let flagid = flag.id;
		return 'https://app.optimizely.com/v2/projects/' + this.projectId + '/features/' + flagid + '#modal';
	}
	
	getExperimentPath(flag: any): string {
		if (this.activeInstance == null) return undefined;
		let flagid = flag.id;
		return 'https://app.optimizely.com/v2/projects/' + this.projectId + '/experiments/' + flagid + '/variations';
	}

	getEvents(): string[] {
		if (this.activeInstance == null) return []
		const config = this.activeInstance.get()
		if (config == null) return []

		return config.events.map(e => e.key)
	}

	getAttributes() {
		if (this.activeInstance == null) return []
		const config = this.activeInstance.get()
		if (config == null) return []

		return config.attributes.map(a => a.key)
	}

	getExperiment(flagKey: string): any {
		if (this.activeInstance != null) {
			let ret =  this.activeInstance.get().experiments.filter(e => e.key == flagKey);
			if (ret.length > 0) {
				return ret[0]
			}
			var e:any = null;
			this.activeInstance.get().groups.forEach(g => {
				let ret = g.experiments.filter(e => e.key == flagKey);
				if (ret != null && ret.length > 0) {
					e = ret[0]
				}
			})
			if (e != null) {
				return e
			}
	   }
   }

	getFeatureFlag(flagKey: string): any {
		if (this.activeInstance != null) {
			 let ret:[any] =  this.activeInstance.get().featureFlags.filter(f => f.key == flagKey);
			 if (ret.length > 0) {
				 return ret[0]
			 }
		}
	}

	async load(sdkKey:string) {
		const manager = new HttpPollingDatafileManager({
			sdkKey: sdkKey,
			autoUpdate: true,
			updateInterval: 5000,
		  })
		  manager.start()
		  await manager.onReady()

		  manager.on('update', ({ datafile }) => {
			//console.log('New datafile available: ')
			//console.log(datafile)
		  })
		

		if (manager.get() == null || manager.get == {}) {
			window.showErrorMessage('SDK Key did not initialize correctly')
		}
		else {
			window.showInformationMessage('Optimizely configured successfully');
			this.activeInstance = manager
			this.activeSdkKey = sdkKey
			this.store[sdkKey] = manager
			this.projectId = manager.get().projectId
		}
	}

	async stop() {
		console.log('stop was called');
		for (let key in this.store) {
			this.store[key].close();
			this.store[key] = null;
			this.activeInstance = null;
		}
	}

	getFlags(): string[] {
		if (this.activeInstance == null) {
			return [];
		}
		else {
			let conf = this.activeInstance.get();
			if (conf == null) {
				console.log('now config is null');
			}

			var arr:string[] = new Array();

			for (let e of conf.featureFlags) {
				arr.push(e.key);
			}
			return arr;
		}
	}

	getExperiments(): string[] {
		if (this.activeInstance == null) {
			console.log("activeInstance is null");
			return [];
		}
		else {
			let conf = this.activeInstance.get();
			if (conf == null) {
				console.log('now config is null');
			}

			var arr:string[] = new Array();

			for (let e of this.activeInstance.get().experiments) {
				arr.push(e.key);
			}

			for (let g of this.activeInstance.get().groups) {
				for (let e of g.experiments) {
					arr.push(e.key);
				}
			}

			return arr;
		}
	}

}
