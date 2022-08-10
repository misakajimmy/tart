import { interfaces } from 'inversify';
import { IOnigLib } from 'vscode-textmate';
import { OnigScanner, OnigString } from 'onigasm';
export declare class OnigasmLib implements IOnigLib {
    createOnigScanner(sources: string[]): OnigScanner;
    createOnigString(sources: string): OnigString;
}
declare const _default: (bind: interfaces.Bind, unbind: interfaces.Unbind, isBound: interfaces.IsBound, rebind: interfaces.Rebind) => void;
export default _default;
export declare function dynamicOnigasmLib(ctx: interfaces.Context): Promise<IOnigLib>;
export declare function createOnigasmLib(): Promise<IOnigLib>;
