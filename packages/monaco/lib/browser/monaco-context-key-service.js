var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { inject, injectable, postConstruct } from 'inversify';
import { ContextKeyService } from '@tart/core';
let MonacoContextKeyService = class MonacoContextKeyService extends ContextKeyService {
    constructor() {
        super(...arguments);
        this.expressions = new Map();
    }
    createKey(key, defaultValue) {
        return this.contextKeyService.createKey(key, defaultValue);
    }
    match(expression, context) {
        const ctx = context || this.activeContext || (window.document.activeElement instanceof HTMLElement ? window.document.activeElement : undefined);
        const parsed = this.parse(expression);
        if (!ctx) {
            return this.contextKeyService.contextMatchesRules(parsed);
        }
        const keyContext = this.contextKeyService.getContext(ctx);
        return monaco.keybindings.KeybindingResolver.contextMatchesRules(keyContext, parsed);
    }
    parseKeys(expression) {
        const expr = monaco.contextkey.ContextKeyExpr.deserialize(expression);
        // @ts-ignore
        return expr ? new Set(expr.keys()) : expr;
    }
    init() {
        this.contextKeyService.onDidChangeContext(e => this.fireDidChange({
            affects: keys => e.affectsSome(keys)
        }));
    }
    parse(when) {
        let expression = this.expressions.get(when);
        if (!expression) {
            expression = monaco.contextkey.ContextKeyExpr.deserialize(when);
            if (expression) {
                this.expressions.set(when, expression);
            }
        }
        return expression;
    }
};
__decorate([
    inject(monaco.contextKeyService.ContextKeyService)
], MonacoContextKeyService.prototype, "contextKeyService", void 0);
__decorate([
    postConstruct()
], MonacoContextKeyService.prototype, "init", null);
MonacoContextKeyService = __decorate([
    injectable()
], MonacoContextKeyService);
export { MonacoContextKeyService };

//# sourceMappingURL=../../lib/browser/monaco-context-key-service.js.map
