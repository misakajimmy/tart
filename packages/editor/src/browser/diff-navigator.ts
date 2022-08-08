import {TextEditor} from './editor';

export interface DiffNavigator {
    revealFirst: boolean;

    canNavigate(): boolean;

    hasNext(): boolean;

    hasPrevious(): boolean;

    next(): void;

    previous(): void;
}

export const DiffNavigatorProvider = Symbol('DiffNavigatorProvider');
export type DiffNavigatorProvider = (editor: TextEditor) => DiffNavigator;
