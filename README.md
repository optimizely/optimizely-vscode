# Optimizely VSCode Extension

The Optimizely VSCode extension autocompletes the following parameters in Javascript, Typescript, and React:
- feature keys
- experiment keys
- feature variables
- event keys

In other languages, you can insert the preceding list of elements using the following keyboard shortcuts.

This extension also evaluates if provided feature keys are valid for Optimizely's public SDK methods (for example, getFeatureVariable(feature_key, userID, attributes), or isFeatureEnabled(feature_key, userID)) for Javascript and TypeScript. If a given feature_key is invalid (i.e., doesn't exist in the datafile for the sdk key used in "Optimizely: config" command), the extension highlights it and displays a warning on hover.

**Compatibilty:** The Optimizely VSCode extension is compatiable with 1.34 and higher of vscode. It currently supports SDKs versions released *before* February 2020.

## Features

- Auto-complete for experiment and feature key parameters as well as feature variables when applicable. (e.g. getFeatureVariable(feature_key, 'list of variables) and getFeatureVarableString('feature_key, 'only list of string feature variable keys)
- Open feature or experiment edit page from IDE.  Simply highlight the feature key or experiment key and hit command-option-o.
- List Experiment variations or feature variables - select experiment or feature key, command-option-v
- List Attribute Keys - command-option-a.
- List Events - command-option-e
- List Experiment Keys - command-option-x
- List Feature Keys - command-option-f
- Command "optimizely: Configuration Debug Dialog" will bring up a debug dialog within the IDE that has your current sdk key.  You can run activate and isFeatureEnabled and getFeatureVariable functions changing the attribute to make sure you have the right configuration for your feature rollout.  If you change sdk keys, you should open a new dialog.

## Installation and configuration

On installation of the Optimizely extension, VSCode will not prompt you to configure the extension. To add your SDK Key and configure the extension, run the "Optimizely: Configure" command from your command pallete.

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
