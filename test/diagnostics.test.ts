import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { activateDiagnostics, updateDiagnostics } from '../src/diagnostics'; 
import { OptimizelyService } from '../src/optimizelyService';

const diagnosticCollection = vscode.languages.createDiagnosticCollection();
sinon.mock('vscode');
sinon.stub(vscode.languages,'createDiagnosticCollection').returns(diagnosticCollection);
const testPath = path.join(__dirname, '..', '..', 'test');
const uri = vscode.Uri.file(path.join(testPath, 'diagnosticsTest.txt'));
const flags = ['flag1','flag2','flag3'];


suite('diagnostics utils tests', () => {
  const context: vscode.ExtensionContext = ({
    subscriptions: {push: sinon.spy()},
  } as unknown) as vscode.ExtensionContext;
  const optimizelyService = new OptimizelyService;
  sinon.stub(optimizelyService, 'getFlags').returns(flags);
  sinon.stub(optimizelyService, 'getProjectId').returns('myProjectID');
      
  test('context.subscriptions.push is being called 4 times when diagnostics in activated', async () => {
    activateDiagnostics(context, optimizelyService);
    sinon.assert.callCount(context.subscriptions.push as any, 4);
  });

  test('updateDiagnostics() adds expected number of diagnostics to diagnosticCollection from provided diagnosticsTest.txt', async function() {
    const document = await vscode.workspace.openTextDocument(uri);
    updateDiagnostics(optimizelyService, document);
    assert.equal(diagnosticCollection.get(document.uri).length, 8);
  });
});
