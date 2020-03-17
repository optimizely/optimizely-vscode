import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';

import * as providers from '../src/providers';

let testPath = path.join(__dirname, '..', '..', 'test');

suite('provider utils tests', () => {

	test('testRegEx', async () => {
		// TODO: generate the test data in this file
		const uri = vscode.Uri.file(path.join(testPath, 'test.txt'));
		const tests = [
			{
				name: "getFeatureVariable",
				testname: "getFeatureVariable-singleQuote",
				expected: true,
				line: 0,
				char: 1,
			},
			{
				name: "getFeatureVariable",
				testname: "getFeatureVariable-doubleQuote",
				expected: true,
				line: 1,
				char: 1,
			},
			{
				name: "getFeatureVariableString",
				testname: "getFeatureVariableString-singleQuote",
				expected: true,
				line: 2,
				char: 1,
			},
			{
				name: "getFeatureVariableString",
				testname: "getFeatureVariableString-doubleQuote",
				expected: true,
				line: 3,
				char: 1,
			},
			{
				name: "getFeatureVariableDouble",
				testname: "getFeatureVariableDouble-singleQuote",
				expected: true,
				line: 4,
				char: 1,
			},
			{
				name: "getFeatureVariableDouble",
				testname: "getFeatureVariableDouble-doubleQuote",
				expected: true,
				line: 5,
				char: 1,
			},
			{
				name: "getFeatureVariableInteger",
				testname: "getFeatureVariableInteger-singleQuote",
				expected: true,
				line: 6,
				char: 1,
			},
			{
				name: "getFeatureVariableInteger",
				testname: "getFeatureVariableInteger-doubleQuote",
				expected: true,
				line: 7,
				char: 1,
			},
			{
				name: "getFeatureVariableBoolean",
				testname: "getFeatureVariableBoolean-singleQuote",
				expected: true,
				line: 4,
				char: 1,
			},
			{
				name: "getFeatureVariableBoolean",
				testname: "getFeatureVariableBoolean-doubleQuote",
				expected: true,
				line: 5,
				char: 1,
			}
		];

		const document = await vscode.workspace.openTextDocument(uri);
		tests.forEach(t => {
			const pos = new vscode.Position(t.line, t.char);
			let linePrefix = document.lineAt(pos).text.substring(0, pos.character);
			assert.equal(linePrefix.match(providers.getFeatureRegEx(t.name)), t.expected)
			assert.equal(t.expected, t.expected);
		});
	});
});
