/********************************************************************************
 * Copyright (C) 2018 Ericsson and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
import { INITIAL } from 'vscode-textmate';
export class TokenizerState {
    constructor(ruleStack) {
        this.ruleStack = ruleStack;
    }
    clone() {
        return new TokenizerState(this.ruleStack);
    }
    equals(other) {
        return other instanceof TokenizerState && (other === this || other.ruleStack === this.ruleStack);
    }
}
export var TokenizerOption;
(function (TokenizerOption) {
    /**
     * The default TextMate tokenizer option.
     *
     * @deprecated Use the current value of `editor.maxTokenizationLineLength` preference instead.
     */
    TokenizerOption.DEFAULT = {
        lineLimit: 400
    };
})(TokenizerOption || (TokenizerOption = {}));
export function createTextmateTokenizer(grammar, options) {
    if (options.lineLimit !== undefined && (options.lineLimit <= 0 || !Number.isInteger(options.lineLimit))) {
        throw new Error(`The 'lineLimit' must be a positive integer. It was ${options.lineLimit}.`);
    }
    return {
        getInitialState: () => new TokenizerState(INITIAL),
        tokenizeEncoded(line, state) {
            let processedLine = line;
            if (options.lineLimit !== undefined && line.length > options.lineLimit) {
                // Line is too long to be tokenized
                processedLine = line.substr(0, options.lineLimit);
            }
            const result = grammar.tokenizeLine2(processedLine, state.ruleStack);
            return {
                endState: new TokenizerState(result.ruleStack),
                tokens: result.tokens
            };
        },
        tokenize(line, state) {
            let processedLine = line;
            if (options.lineLimit !== undefined && line.length > options.lineLimit) {
                // Line is too long to be tokenized
                processedLine = line.substr(0, options.lineLimit);
            }
            const result = grammar.tokenizeLine(processedLine, state.ruleStack);
            return {
                endState: new TokenizerState(result.ruleStack),
                tokens: result.tokens.map(t => ({
                    startIndex: t.startIndex,
                    scopes: t.scopes.reverse().join(' ')
                }))
            };
        }
    };
}

//# sourceMappingURL=../../../lib/browser/textmate/textmate-tokenizer.js.map
