import { Range } from 'vscode-languageserver-types';
export interface TextDocumentContentChangeDelta {
    readonly range: Range;
    readonly rangeLength?: number;
    readonly text: string;
}
export declare namespace TextDocumentContentChangeDelta {
    function is(arg: any): arg is TextDocumentContentChangeDelta;
}
