import { TextEditor } from './editor';
export interface DiffNavigator {
    revealFirst: boolean;
    canNavigate(): boolean;
    hasNext(): boolean;
    hasPrevious(): boolean;
    next(): void;
    previous(): void;
}
export declare const DiffNavigatorProvider: unique symbol;
export declare type DiffNavigatorProvider = (editor: TextEditor) => DiffNavigator;
