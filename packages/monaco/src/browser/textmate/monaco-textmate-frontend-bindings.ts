import {interfaces} from 'inversify';
import {MonacoTextmateService, OnigasmPromise} from './monaco-textmate-service';
import {FrontendApplicationContribution} from '@tartjs/core';
import {bindContributionProvider} from '@tartjs/core/lib/common';
import {LanguageGrammarDefinitionContribution} from './textmate-contribution';
import {TextmateRegistry} from './textmate-registry';
import {IOnigLib} from 'vscode-textmate';
import {isBasicWasmSupported} from '@tartjs/core/lib/browser/browser';
import wasm from 'onigasm/lib/onigasm.wasm';
import {loadWASM, OnigScanner, OnigString} from 'onigasm';
import {MonacoThemeRegistry} from './monaco-theme-registry';

export class OnigasmLib implements IOnigLib {
  createOnigScanner(sources: string[]): OnigScanner {
    return new OnigScanner(sources);
  }

  createOnigString(sources: string): OnigString {
    return new OnigString(sources);
  }
}

export default (bind: interfaces.Bind, unbind: interfaces.Unbind, isBound: interfaces.IsBound, rebind: interfaces.Rebind) => {
  bind(OnigasmPromise).toDynamicValue(dynamicOnigasmLib).inSingletonScope();
  bind(MonacoTextmateService).toSelf().inSingletonScope();
  bind(FrontendApplicationContribution).toService(MonacoTextmateService);
  bindContributionProvider(bind, LanguageGrammarDefinitionContribution);
  bind(TextmateRegistry).toSelf().inSingletonScope();
  bind(MonacoThemeRegistry).toDynamicValue(() => MonacoThemeRegistry.SINGLETON).inSingletonScope();
};

export async function dynamicOnigasmLib(ctx: interfaces.Context): Promise<IOnigLib> {
  return createOnigasmLib();
}

export async function createOnigasmLib(): Promise<IOnigLib> {
  if (!isBasicWasmSupported) {
    throw new Error('wasm not supported');
  }
  await loadWASM(wasm);
  return new OnigasmLib();
}
