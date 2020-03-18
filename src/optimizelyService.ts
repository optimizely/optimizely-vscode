
const { HttpPollingDatafileManager } = require('@optimizely/js-sdk-datafile-manager')
import { window } from 'vscode';

export class OptimizelyService {
	private readonly store: { [key: string]: any } = {};
	private activeInstance: any;
	private projectId: string;

	constructor() {
		console.log("created ")
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

	allFeatureVariables(featureKey: string, filterByType: string): string[] {
		if (this.activeInstance != null) {
			console.log('getting flag')
			const flag = this.getFeatureFlag(featureKey);
			if (flag != null) {
				console.log('getting variable')
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

	getExperiment(flagKey: string): { flag: any } | PromiseLike<{ flag: any; }> {
		if (this.activeInstance != null) {
			let ret =  this.activeInstance.get().experiments.filter(e => e.key == flagKey);
			if (ret.length > 0) {
				return ret[0]
			}
	   }
   }

	getFeatureFlag(flagKey: string): any {
		if (this.activeInstance != null) {
			console.log('filtering')
			 let ret:[any] =  this.activeInstance.get().featureFlags.filter(f => f.key == flagKey);
			 console.log(ret)
			 if (ret.length > 0) {
				 console.log(ret[0])
				 return ret[0]
			 }
		}
	}

	async load(sdkKey:string) {
		console.log("sdkkey")
		console.log(sdkKey)
		const manager = new HttpPollingDatafileManager({
			sdkKey: sdkKey,
			autoUpdate: true,
			updateInterval: 5000,
		  })
		  console.log('starting.')
		  manager.start()
		  await manager.onReady()
		  console.log('back from onReady')

		  manager.on('update', ({ datafile }) => {
			console.log('New datafile available: ')
			console.log(datafile)
		  })
		

		if (manager.get() == null || manager.get == {}) {
			console.log('opt config is null');
			window.showErrorMessage('SDK Key did not initialize correctly')
		}
		else {
			window.showInformationMessage('Optimizely configured successfully');
			this.activeInstance = manager
			this.store[sdkKey] = manager
			this.projectId = manager.get().projectId
			console.log(manager.get())
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
			let conf = this.activeInstance.get();
			if (conf == null) {
				console.log('now config is null');
			}
			console.log("getting features");
			for (let e of conf.featureFlags) {
				console.log(e);
			}

			var arr:string[] = new Array();

			for (let e of conf.featureFlags) {
				arr.push(e.key);
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
			let conf = this.activeInstance.get();
			if (conf == null) {
				console.log('now config is null');
			}
			console.log("getting experiments");
			console.log(this.activeInstance.get().experiments)
			for (let e of this.activeInstance.get().experiments) {
				console.log(e);
				console.log(e.key)
			}

			var arr:string[] = new Array();

			for (let e of this.activeInstance.get().experiments) {
				arr.push(e.key);
			}
			console.log("arr has length " + String(arr.length));
			return arr;
		}
	}

}
