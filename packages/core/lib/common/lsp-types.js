import { Range } from 'vscode-languageserver-types';
export var TextDocumentContentChangeDelta;
(function (TextDocumentContentChangeDelta) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function is(arg) {
        return !!arg && typeof arg['text'] === 'string' && (typeof arg['rangeLength'] === 'number' || typeof arg['rangeLength'] === 'undefined') && Range.is(arg['range']);
    }
    TextDocumentContentChangeDelta.is = is;
})(TextDocumentContentChangeDelta || (TextDocumentContentChangeDelta = {}));

//# sourceMappingURL=../../lib/common/lsp-types.js.map
