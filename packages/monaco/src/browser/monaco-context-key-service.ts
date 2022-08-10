import {inject, injectable, postConstruct} from 'inversify';
import {ContextKey, ContextKeyService} from '@tartjs/core';

@injectable()
export class MonacoContextKeyService extends ContextKeyService {

    activeContext?: HTMLElement;
    @inject(monaco.contextKeyService.ContextKeyService)
    protected readonly contextKeyService: monaco.contextKeyService.ContextKeyService;
    protected readonly expressions = new Map<string, monaco.contextkey.ContextKeyExpression>();

    createKey<T>(key: string, defaultValue: T | undefined): ContextKey<T> {
        return this.contextKeyService.createKey(key, defaultValue);
    }

    match(expression: string, context?: HTMLElement): boolean {
        const ctx = context || this.activeContext || (window.document.activeElement instanceof HTMLElement ? window.document.activeElement : undefined);
        const parsed = this.parse(expression);
        if (!ctx) {
            return this.contextKeyService.contextMatchesRules(parsed);
        }
        const keyContext = this.contextKeyService.getContext(ctx);
        return monaco.keybindings.KeybindingResolver.contextMatchesRules(keyContext, parsed);
    }

    parseKeys(expression: string): Set<string> | undefined {
        const expr = monaco.contextkey.ContextKeyExpr.deserialize(expression);
        // @ts-ignore
        return expr ? new Set<string>(expr.keys()) : expr;
    }

    @postConstruct()
    protected init(): void {
        this.contextKeyService.onDidChangeContext(e =>
            this.fireDidChange({
                affects: keys => e.affectsSome(keys)
            })
        );
    }

    protected parse(when: string): monaco.contextkey.ContextKeyExpression | undefined {
        let expression = this.expressions.get(when);
        if (!expression) {
            expression = monaco.contextkey.ContextKeyExpr.deserialize(when);
            if (expression) {
                this.expressions.set(when, expression);
            }
        }
        return expression;
    }

}
