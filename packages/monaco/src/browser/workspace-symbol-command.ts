import {inject, injectable} from 'inversify';
import {
    KeybindingContribution,
    KeybindingRegistry,
    LabelProvider,
    OpenerService,
    QuickAccessContribution,
    QuickAccessProvider,
    QuickAccessRegistry
} from '@tart/core';
import {
    CancellationToken,
    Command,
    CommandContribution,
    CommandHandler,
    CommandRegistry,
    MenuContribution,
    MenuModelRegistry,
    SelectionService
} from '@tart/core/lib/common';
import {
    findMatches,
    QuickInputService,
    QuickPickItem,
    QuickPicks
} from '@tart/core/lib/common/quick-pick-service';
import {nls} from '@tart/core/lib/common/nls';
import {WorkspaceSymbolParams} from 'vscode-languageserver-protocol';
import URI from '@tart/core/lib/common/uri';
import {Position, Range, SymbolInformation} from 'vscode-languageserver-types';
import {MonacoLanguages, WorkspaceSymbolProvider} from './monaco-languages';

@injectable()
export class WorkspaceSymbolCommand implements QuickAccessProvider, CommandContribution, KeybindingContribution, MenuContribution, CommandHandler, QuickAccessContribution {
    public static readonly PREFIX = '#';
    @inject(MonacoLanguages) protected readonly languages: MonacoLanguages;
    @inject(OpenerService) protected readonly openerService: OpenerService;
    @inject(QuickInputService) protected quickInputService: QuickInputService;
    @inject(QuickAccessRegistry) protected quickAccessRegistry: QuickAccessRegistry;
    @inject(SelectionService) protected selectionService: SelectionService;
    @inject(LabelProvider) protected readonly labelProvider: LabelProvider;
    private command = Command.toDefaultLocalizedCommand({
        id: 'languages.json.workspace.symbol',
        label: 'Go to Symbol in Workspace...'
    });

    isEnabled(): boolean {
        return this.languages.workspaceSymbolProviders !== undefined;
    }

    execute(): void {
        this.quickInputService.open(WorkspaceSymbolCommand.PREFIX);
    }

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(this.command, this);
    }

    registerMenus(menus: MenuModelRegistry): void {
        // menus.registerMenuAction(EditorMainMenu.WORKSPACE_GROUP, {
        //     commandId: this.command.id,
        //     order: '2'
        // });
    }

    registerKeybindings(keybindings: KeybindingRegistry): void {
        keybindings.registerKeybinding({
            command: this.command.id,
            keybinding: this.isElectron() ? 'ctrlcmd+t' : 'ctrlcmd+o',
        });
    }

    registerQuickAccessProvider(): void {
        this.quickAccessRegistry.registerQuickAccessProvider({
            getInstance: () => this,
            prefix: WorkspaceSymbolCommand.PREFIX,
            placeholder: '',
            helpEntries: [{description: nls.localizeByDefault('Go to Symbol in Workspace'), needsEditor: false}]
        });
    }

    async getPicks(filter: string, token: CancellationToken): Promise<QuickPicks> {
        const items: QuickPicks = [];
        if (this.languages.workspaceSymbolProviders) {
            const param: WorkspaceSymbolParams = {
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

    protected createItem(sym: SymbolInformation, provider: WorkspaceSymbolProvider, filter: string, token: CancellationToken): QuickPickItem {
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
                        } else {
                            // the symbol didn't resolve -> use given symbol
                            this.openURL(uri, sym.location.range.start, sym.location.range.end);
                        }
                    });
                } else {
                    // resolveWorkspaceSymbol wasn't specified
                    this.openURL(uri, sym.location.range.start, sym.location.range.end);
                }
            }
        });
    }

    protected toCssClassName(symbolKind: SymbolKind, inline?: boolean): string[] | undefined {
        const kind = SymbolKind[symbolKind];
        if (!kind) {
            return undefined;
        }
        return [`codicon ${inline ? 'inline' : 'block'} codicon-symbol-${kind.toLowerCase() || 'property'}`];
    }

    private isElectron(): boolean {
        return false;
    }

    private openURL(uri: URI, start: Position, end: Position): void {
        this.openerService.getOpener(uri).then(opener => opener.open(uri, {
            selection: Range.create(start, end)
        }));
    }
}

enum SymbolKind {
    File = 1,
    Module = 2,
    Namespace = 3,
    Package = 4,
    Class = 5,
    Method = 6,
    Property = 7,
    Field = 8,
    Constructor = 9,
    Enum = 10,
    Interface = 11,
    Function = 12,
    Variable = 13,
    Constant = 14,
    String = 15,
    Number = 16,
    Boolean = 17,
    Array = 18,
    Object = 19,
    Key = 20,
    Null = 21,
    EnumMember = 22,
    Struct = 23,
    Event = 24,
    Operator = 25,
    TypeParameter = 26
}
