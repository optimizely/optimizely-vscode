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
				char: 1
			},
			{
				name: "getFeatureVariable",
				testname: "getFeatureVariable-doubleQuote",
				expected: true,
				line: 1,
				char: 1
			},
			{
				name: "getFeatureVariableString",
				testname: "getFeatureVariableString-singleQuote",
				expected: true,
				line: 2,
				char: 1
			},
			{
				name: "getFeatureVariableString",
				testname: "getFeatureVariableString-doubleQuote",
				expected: true,
				line: 3,
				char: 1
			},
			{
				name: "getFeatureVariableDouble",
				testname: "getFeatureVariableDouble-singleQuote",
				expected: true,
				line: 4,
				char: 1
			},
			{
				name: "getFeatureVariableDouble",
				testname: "getFeatureVariableDouble-doubleQuote",
				expected: true,
				line: 5,
				char: 1
			},
			{
				name: "getFeatureVariableInteger",
				testname: "getFeatureVariableInteger-singleQuote",
				expected: true,
				line: 6,
				char: 1
			},
			{
				name: "getFeatureVariableInteger",
				testname: "getFeatureVariableInteger-doubleQuote",
				expected: true,
				line: 7,
				char: 1
			},
			{
				name: "getFeatureVariableBoolean",
				testname: "getFeatureVariableBoolean-singleQuote",
				expected: true,
				line: 8,
				char: 1
			},
			{
				name: "getFeatureVariableBoolean",
				testname: "getFeatureVariableBoolean-doubleQuote",
				expected: true,
				line: 9,
				char: 1
			},
			{
				name: "getFeatureVariableJSON",
				testname: "getFeatureVariableJSON-singleQuote",
				expected: true,
				line: 10,
				char: 1
			},
			{
				name: "getFeatureVariableJSON",
				testname: "getFeatureVariableJSON-doubleQuote",
				expected: true,
				line: 11,
				char: 1
			},
			{
				name: "getAllFeatureVariables",
				testname: "getAllFeatureVariables-singleQuote",
				expected: true,
				line: 12,
				char: 1
			},
			{
				name: "getAllFeatureVariables",
				testname: "getAllFeatureVariables-doubleQuote",
				expected: true,
				line: 13,
				char: 1
			}
		];

		const document = await vscode.workspace.openTextDocument(uri);
		tests.forEach(t => {
			const pos = new vscode.Position(t.line, t.char);
			let linePrefix = document.lineAt(pos).text;
			let regex = providers.getFeatureRegEx(t.name);
			assert.equal(linePrefix.match(regex) != null, t.expected)
		});
	});
});
