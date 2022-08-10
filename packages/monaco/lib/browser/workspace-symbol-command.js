var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var WorkspaceSymbolCommand_1;
import { inject, injectable } from 'inversify';
import { LabelProvider, OpenerService, QuickAccessRegistry } from '@tart/core';
import { Command, SelectionService } from '@tart/core/lib/common';
import { findMatches, QuickInputService } from '@tart/core/lib/common/quick-pick-service';
import { nls } from '@tart/core/lib/common/nls';
import URI from '@tart/core/lib/common/uri';
import { Range } from 'vscode-languageserver-types';
import { MonacoLanguages } from './monaco-languages';
let WorkspaceSymbolCommand = WorkspaceSymbolCommand_1 = class WorkspaceSymbolCommand {
    constructor() {
        this.command = Command.toDefaultLocalizedCommand({
            id: 'languages.json.workspace.symbol',
            label: 'Go to Symbol in Workspace...'
        });
    }
    isEnabled() {
        return this.languages.workspaceSymbolProviders !== undefined;
    }
    execute() {
        this.quickInputService.open(WorkspaceSymbolCommand_1.PREFIX);
    }
    registerCommands(commands) {
        commands.registerCommand(this.command, this);
    }
    registerMenus(menus) {
        // menus.registerMenuAction(EditorMainMenu.WORKSPACE_GROUP, {
        //     commandId: this.command.id,
        //     order: '2'
        // });
    }
    registerKeybindings(keybindings) {
        keybindings.registerKeybinding({
            command: this.command.id,
            keybinding: this.isElectron() ? 'ctrlcmd+t' : 'ctrlcmd+o',
        });
    }
    registerQuickAccessProvider() {
        this.quickAccessRegistry.registerQuickAccessProvider({
            getInstance: () => this,
            prefix: WorkspaceSymbolCommand_1.PREFIX,
            placeholder: '',
            helpEntries: [{ description: nls.localizeByDefault('Go to Symbol in Workspace'), needsEditor: false }]
        });
    }
    async getPicks(filter, token) {
        const items = [];
        if (this.languages.workspaceSymbolProviders) {
            const param = {
                query: filter
            };
            const workspaceProviderPromises = [];
            for (const provider of this.languages.workspaceSymbolProviders) {
                workspaceProviderPromises.push((async () => {
                    const symbols = await provider.provideWorkspaceSymbols(param, token);
                    if (symbols && !token.isCancellationRequested) {
                        for (const symbol of symbols) {
                            items.push(this.createItem(symbol, provider, filter, token));
                        }
                    }
                    return symbols;
                })());
            }
            await Promise.all(workspaceProviderPromises.map(p => p.then(sym => sym, _ => undefined)))
                .then(symbols => {
                const filteredSymbols = symbols.filter(el => el && el.length !== 0);
                if (filteredSymbols.length === 0) {
                    items.push({
                        label: filter.length === 0
                            ? nls.localize('wm/monaco/typeToSearchForSymbols', 'Type to search for symbols')
                            : nls.localize('wm/monaco/noSymbolsMatching', 'No symbols matching'),
                    });
                }
            }).catch();
        }
        return items;
    }
    createItem(sym, provider, filter, token) {
        const uri = new URI(sym.location.uri);
        const iconClasses = this.toCssClassName(sym.kind);
        let parent = sym.containerName;
        if (parent) {
            parent += ' - ';
        }
        const description = (parent || '') + this.labelProvider.getName(uri);
        return ({
            label: sym.name,
            description,
            ariaLabel: uri.toString(),
            iconClasses,
            highlights: {
                label: findMatches(sym.name, filter),
                description: findMatches(description, filter)
            },
            execute: () => {
                if (provider.resolveWorkspaceSymbol) {
                    provider.resolveWorkspaceSymbol(sym, token).then(resolvedSymbol => {
                        if (resolvedSymbol) {
                            this.openURL(uri, resolvedSymbol.location.range.start, resolvedSymbol.location.range.end);
                        }
                        else {
                            // the symbol didn't resolve -> use given symbol
                            this.openURL(uri, sym.location.range.start, sym.location.range.end);
                        }
                    });
                }
                else {
                    // resolveWorkspaceSymbol wasn't specified
                    this.openURL(uri, sym.location.range.start, sym.location.range.end);
                }
            }
        });
    }
    toCssClassName(symbolKind, inline) {
        const kind = SymbolKind[symbolKind];
        if (!kind) {
            return undefined;
        }
        return [`codicon ${inline ? 'inline' : 'block'} codicon-symbol-${kind.toLowerCase() || 'property'}`];
    }
    isElectron() {
        return false;
    }
    openURL(uri, start, end) {
        this.openerService.getOpener(uri).then(opener => opener.open(uri, {
            selection: Range.create(start, end)
        }));
    }
};
WorkspaceSymbolCommand.PREFIX = '#';
__decorate([
    inject(MonacoLanguages)
], WorkspaceSymbolCommand.prototype, "languages", void 0);
__decorate([
    inject(OpenerService)
], WorkspaceSymbolCommand.prototype, "openerService", void 0);
__decorate([
    inject(QuickInputService)
], WorkspaceSymbolCommand.prototype, "quickInputService", void 0);
__decorate([
    inject(QuickAccessRegistry)
], WorkspaceSymbolCommand.prototype, "quickAccessRegistry", void 0);
__decorate([
    inject(SelectionService)
], WorkspaceSymbolCommand.prototype, "selectionService", void 0);
__decorate([
    inject(LabelProvider)
], WorkspaceSymbolCommand.prototype, "labelProvider", void 0);
WorkspaceSymbolCommand = WorkspaceSymbolCommand_1 = __decorate([
    injectable()
], WorkspaceSymbolCommand);
export { WorkspaceSymbolCommand };
var SymbolKind;
(function (SymbolKind) {
    SymbolKind[SymbolKind["File"] = 1] = "File";
    SymbolKind[SymbolKind["Module"] = 2] = "Module";
    SymbolKind[SymbolKind["Namespace"] = 3] = "Namespace";
    SymbolKind[SymbolKind["Package"] = 4] = "Package";
    SymbolKind[SymbolKind["Class"] = 5] = "Class";
    SymbolKind[SymbolKind["Method"] = 6] = "Method";
    SymbolKind[SymbolKind["Property"] = 7] = "Property";
    SymbolKind[SymbolKind["Field"] = 8] = "Field";
    SymbolKind[SymbolKind["Constructor"] = 9] = "Constructor";
    SymbolKind[SymbolKind["Enum"] = 10] = "Enum";
    SymbolKind[SymbolKind["Interface"] = 11] = "Interface";
    SymbolKind[SymbolKind["Function"] = 12] = "Function";
    SymbolKind[SymbolKind["Variable"] = 13] = "Variable";
    SymbolKind[SymbolKind["Constant"] = 14] = "Constant";
    SymbolKind[SymbolKind["String"] = 15] = "String";
    SymbolKind[SymbolKind["Number"] = 16] = "Number";
    SymbolKind[SymbolKind["Boolean"] = 17] = "Boolean";
    SymbolKind[SymbolKind["Array"] = 18] = "Array";
    SymbolKind[SymbolKind["Object"] = 19] = "Object";
    SymbolKind[SymbolKind["Key"] = 20] = "Key";
    SymbolKind[SymbolKind["Null"] = 21] = "Null";
    SymbolKind[SymbolKind["EnumMember"] = 22] = "EnumMember";
    SymbolKind[SymbolKind["Struct"] = 23] = "Struct";
    SymbolKind[SymbolKind["Event"] = 24] = "Event";
    SymbolKind[SymbolKind["Operator"] = 25] = "Operator";
    SymbolKind[SymbolKind["TypeParameter"] = 26] = "TypeParameter";
})(SymbolKind || (SymbolKind = {}));

//# sourceMappingURL=../../lib/browser/workspace-symbol-command.js.map
