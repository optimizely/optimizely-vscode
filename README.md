# Optimizely VSCode Extension

The Optimizely VSCode extension lets you access feature keys, and experiment keys, along with feature variables via auto-complete. 

## Features

- Auto-complete for experiment and feature key parameters as well as feature variables when applicable. (e.g. getFeatureVariable(feature_key, 'list of variables) and getFeatureVarableString('feature_key, 'only list of string feature variable keys)
- Open feature or experiment edit page from IDE.  Simply highlight the feature key or experiment key and hit command-option-o.
- List Experiment variations or feature variables - select experiment or feature key, command-option-v
- List Attribute Keys - command-option-a.
- List Events - command-option-e

## Installation and configuration

On installation of the Optimizely extension, VSCode will prompt you to configure the extension, add your SDK Key and you are ready to go. To reconfigure the extension, run the "Optimizely: Configure" command from your command pallete.

**Note:** If you use quick suggestions to autocomplete words, Optimizely autocomplete functionality requires the `editor.quickSuggestions.strings` setting to be enabled. Otherwise, you'll need to press `Ctrl+Space` (default binding) to see your flag key suggestions.

Here's an example configuration with quick suggestions enabled:

```json
{
	"editor.quickSuggestions": {
		"other": true,
		"comments": false,
		"strings": true
	}
}
```
