import { TartInit } from '@tart/core/lib/common';
export declare class FilesystemInit implements TartInit {
    static init(): Promise<any[]>;
    initContainer(): Promise<any[]>;
}
export default FilesystemInit;
