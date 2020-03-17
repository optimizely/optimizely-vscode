
import * as optimizelySDK from '@optimizely/optimizely-sdk';
import { window } from 'vscode';

optimizelySDK.setLogLevel('error'); 

export class OptimizelyService {
	private readonly store: { [key: string]: optimizelySDK.Client } = {};
	private activeInstance: optimizelySDK.Client;
	private projectId: string;

	constructor() {
		console.log("created ")
	}

	setProjectId(projectId: string) {
		this.projectId = projectId; 
	}

	getProjectId(): string {
		if (this.activeInstance != null) {
			return this.activeInstance.getOptimizelyConfig().projectId;
		} 
	}

	isValid(): boolean {
		return this.activeInstance != null && this.activeInstance.getOptimizelyConfig() != null;
	}

	allFeatureVariables(featureKey: string, filterByType: string): string[] {
		if (this.activeInstance != null) {
			const flag = this.getFeatureFlag(featureKey);
			if (flag != null) {
				var variables = new Array<string>()
				for (let key in flag.variablesMap) {
					if (filterByType == 'all' || filterByType == flag.variablesMap[key].type) {
						variables.push(key)
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

	getFlagPath(flag: optimizelySDK.OptimizelyFeature): string {
		if (this.activeInstance == null) return undefined;
		let flagid = flag.id;
		return 'https://app.optimizely.com/v2/projects/' + this.projectId + '/features/' + flagid + '#modal';
	}
	
	getExperimentPath(flag: optimizelySDK.OptimizelyExperiment): string {
		if (this.activeInstance == null) return undefined;
		let flagid = flag.id;
		return 'https://app.optimizely.com/v2/projects/' + this.projectId + '/experiments/' + flagid + '/variations';
	}

	getExperiment(flagKey: string): { flag: optimizelySDK.OptimizelyExperiment; } | PromiseLike<{ flag: any; }> {
		if (this.activeInstance != null) {
			return { flag: this.activeInstance.getOptimizelyConfig().experimentsMap[flagKey]};
	   }
   }

	getFeatureFlag(flagKey: string): optimizelySDK.OptimizelyFeature {
		if (this.activeInstance != null) {
		 	return this.activeInstance.getOptimizelyConfig().featuresMap[flagKey];
		}
	}

	async load(sdkKey:string) {
		console.log("sdkkey")
		const optimizely = optimizelySDK.createInstance({
			sdkKey: sdkKey,
			datafileOptions: {
			  autoUpdate: true,
			  updateInterval: 60000, // 1 minute in milliseconds
			},
		  });

		this.store[sdkKey] = optimizely;
		this.activeInstance = optimizely
		await optimizely.onReady();
		console.log("optimizely activated");

		if (optimizely.getOptimizelyConfig() == null) {
			console.log('opt config is null');
			window.showErrorMessage('SDK Key did not initialize correctly')
		}
		else {
			window.showInformationMessage('Optimizely configured successfully');
			this.projectId = this.activeInstance.getOptimizelyConfig().projectId
			console.log('opt config is not null');
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
		console.log("inside get flags");
		if (this.activeInstance == null) {
			console.log("activeInstance is null");
			return [];
		}
		else {
			let conf = this.activeInstance.getOptimizelyConfig();
			if (conf == null) {
				console.log('now config is null');
			}
			console.log("getting features");
			for (let e in this.activeInstance.getOptimizelyConfig().featuresMap) {
				console.log(e);
			}

			var arr:string[] = new Array();

			for (let e in this.activeInstance.getOptimizelyConfig().featuresMap) {
				arr.push(e);
			}
			console.log("arr has length " + String(arr.length));
			return arr;
		}
	}

	getExperiments(): string[] {
		console.log("inside get experiments");
		if (this.activeInstance == null) {
			console.log("activeInstance is null");
			return [];
		}
		else {
			let conf = this.activeInstance.getOptimizelyConfig();
			if (conf == null) {
				console.log('now config is null');
			}
			console.log("getting experiments");
			for (let e in this.activeInstance.getOptimizelyConfig().experimentsMap) {
				console.log(e);
			}

			var arr:string[] = new Array();

			for (let e in this.activeInstance.getOptimizelyConfig().experimentsMap) {
				arr.push(e);
			}
			console.log("arr has length " + String(arr.length));
			return arr;
		}
	}

}
