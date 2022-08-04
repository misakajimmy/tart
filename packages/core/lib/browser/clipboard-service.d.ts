import { MaybePromise } from '../common/types';
export declare const ClipboardService: unique symbol;
export interface ClipboardService {
    readText(): MaybePromise<string>;
    writeText(value: string): MaybePromise<void>;
}
