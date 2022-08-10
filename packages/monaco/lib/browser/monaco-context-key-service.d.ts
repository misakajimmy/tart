import { ContextKey, ContextKeyService } from '@tart/core';
export declare class MonacoContextKeyService extends ContextKeyService {
    activeContext?: HTMLElement;
    protected readonly contextKeyService: monaco.contextKeyService.ContextKeyService;
    protected readonly expressions: Map<string, monaco.contextkey.ContextKeyExpression>;
    createKey<T>(key: string, defaultValue: T | undefined): ContextKey<T>;
    match(expression: string, context?: HTMLElement): boolean;
    parseKeys(expression: string): Set<string> | undefined;
    protected init(): void;
    protected parse(when: string): monaco.contextkey.ContextKeyExpression | undefined;
}
