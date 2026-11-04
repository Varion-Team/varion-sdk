import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

test('all package exports have checked NodeNext declarations and reject invalid calls', async () => {
  const file = fileURLToPath(new URL('./consumer.mts', import.meta.url));
  const source = `
import * as deployApi from '@varion/sdk/deploy';
import * as uiApi from '@varion/sdk/dev-ui';
import * as viteApi from '@varion/sdk/dev-ui/vite';
import type { Plugin } from 'vite';

const target = { cabinetUrl: 'https://example.com', serverId: 'srv-1', token: 'token' };
const request = deployApi.buildDeployRequest({ ...target, env: 'test', project: 'demo',
  releaseId: '20261029-120000-0123abcd', sha256: 'a'.repeat(64) });
const signed = deployApi.signDeployRequest(request);
const json: string = deployApi.canonicalJson(request);
const verified: boolean = deployApi.verifyDeployRequest(signed);
const keySource: 'file' | 'env' = deployApi.showKey().source;
const plugin: Plugin = viteApi.varionDevUi({ shims: ['shim.js'], fallback: 'http://127.0.0.1:7790/' });
const samePlugin: Plugin = uiApi.varionDevUi();
const markup: string = uiApi.withDevUiTable('', { url: 'http://localhost:5173', root: 'ui' });
const proxy = await uiApi.startDevUiProxy({ upstream: 'http://localhost:5173', port: 0 });
await proxy.close();
const result = await deployApi.deployRelease({ ...target, bundlePath: 'bundle.zip' });
const phase: string | undefined = result.final?.phase;
const size: number = result.upload.size;
const account = await deployApi.getAccount(target);
const allowed: boolean = account.servers[0].deployProd;
// @ts-expect-error unsupported deployment action
deployApi.buildDeployRequest({ ...request, action: 'remove' });
// @ts-expect-error invalid bundle path
deployApi.deployRelease({ ...target, bundlePath: 123 });
// @ts-expect-error server ID must be a string
deployApi.listReleases({ ...target, serverId: 123 });
// @ts-expect-error deploy IDs must be strings
deployApi.getDeploy({ ...target, deployId: 123 });
// @ts-expect-error callbacks receive the documented code shape
deployApi.signIn({ ...target, onCode: (code) => code.missing });
// @ts-expect-error invalid shim path
viteApi.varionDevUi({ shims: [42] });
// @ts-expect-error invalid proxy port
uiApi.startDevUiProxy({ upstream: 'http://localhost:5173', port: 'auto' });
// @ts-expect-error invalid result member
result.fianl;
// @ts-expect-error account permissions are booleans
allowed.toUpperCase();
`;
  const options = { noEmit: true, strict: true, target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext,
    types: ['node'], skipLibCheck: false };
  const host = ts.createCompilerHost(options);
  const originalGetSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (name, language, ...rest) => path.resolve(name) === file
    ? ts.createSourceFile(name, source, language, true)
    : originalGetSourceFile(name, language, ...rest);
  const originalExists = host.fileExists.bind(host);
  host.fileExists = (name) => path.resolve(name) === file || originalExists(name);
  const program = ts.createProgram([file], options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCurrentDirectory: () => process.cwd(), getCanonicalFileName: (name) => name, getNewLine: () => '\n',
  }));

  const checker = program.getTypeChecker();
  const input = program.getSourceFile(file);
  for (const statement of input.statements) {
    if (!ts.isImportDeclaration(statement) || !statement.moduleSpecifier.text.startsWith('@varion/sdk/')) continue;
    const entry = statement.moduleSpecifier.text;
    const module = checker.getSymbolAtLocation(statement.moduleSpecifier);
    assert.ok(module, entry);
    const declared = checker.getExportsOfModule(module).filter((symbol) => {
      const resolved = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
      return resolved.flags & ts.SymbolFlags.Value;
    }).map((symbol) => symbol.name).sort();
    const actual = Object.keys(await import(entry)).sort();
    assert.deepEqual(declared, actual, `${entry}: declarations must cover exactly the runtime exports`);
  }
});
