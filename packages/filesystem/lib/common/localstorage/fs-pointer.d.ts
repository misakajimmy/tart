import { LocalStorage } from "./localstorage-fs";
export declare const fsPointer: (id: LocalStorage.Id) => FS.FsPointer;
export declare const movePointer: (from: FS.FsPointer, to: FS.FsPointer, name: string, resource: any) => void;
export declare const setNotifyDidChangeFile: (change: ({ changes: any }: {
    changes: any;
}) => any) => void;
export declare const get_root_pointer: () => FS.Directory;
export declare const get_file_list: (fp: FS.FsPointer) => FS.File[];
export declare const get_dir_list: (fp: FS.FsPointer) => FS.Directory[];
export declare const child_file_pointer: (fp: any, name: any) => any;
export declare const child_dir_pointer: (fp: any, name: any) => any;
export declare const parent_dir_pointer: (fp: any) => any;
export declare const add_file_to_pointer: (fp: any, filename: any, filedata: any, resource: any) => FS.FsPointer;
export declare const add_dir_to_pointer: (fp: any, dirname: any, dirdata: any, resource: any) => FS.FsPointer;
export declare const remove_pointer: (fp: any, resource: any) => boolean;
export declare const update_data_file_pointer: (fp: any, filedata: any) => boolean;
export declare const get_path_pointer: (fp: FS.FsPointer, path: string) => FS.FsPointer | undefined;
export declare const get_pointer: (fp: FS.FsPointer, path: string) => FS.FsPointer | undefined;
export declare const get_pointer_path: (fp: any) => any;
export declare const get_file_data_list_by_data_predicate: (fp: any, predicate: any) => any;
export declare const get_file_data_list: (fp: any) => any;
export declare const delete_file_by_data_predicate: (fp: any, predicate: any, resource: any) => boolean;
export declare const delete_dir_by_data_predicate: (fp: any, predicate: any, resource: any) => boolean;
export declare const modify_file_data_by_data_predicate: (fp: any, predicate: any, newData: any) => boolean;
export declare const store_file_in_dir: (fp: any, name: any, data: any, uri: any) => void;
export declare const reload_pointer: (fp: any) => FS.FsPointer;
export declare const get_dir_name_list: (fp: any) => string[];
export declare const get_dir_data_list: (fp: any) => LocalStorage.Data[];
export declare const store_dir_in_dir: (fp: any, name: any, data: any, resource: any) => void;
export declare const get_dir_by_name: (fp: any, name: string) => FS.Directory | undefined;
export declare const get_parent_dir: (fp: any) => any;
export declare const get_child_list: (fp: FS.FsPointer) => FS.Combine[];
export declare namespace FS {
    enum Type {
        file = 0,
        directory = 1,
        error = 2
    }
    type Name = string;
    type Id = LocalStorage.Id;
    type Parent = (id: Id) => {};
    type FsPointer = File | Directory | Error;
    type Combine = File | Directory;
    type File = {
        type: Type.file;
        name: Name;
        id: Id;
        parent: Parent;
        children: () => Error;
        files: () => Error;
        dirs: () => Error;
        data: () => LocalStorage.Data;
        raw: LocalStorage.File;
    };
    type Directory = {
        type: Type.directory;
        name: Name;
        id: Id;
        parent: Parent;
        children: () => FsPointer[];
        files: () => File[];
        dirs: () => Directory[];
        data: () => LocalStorage.Data;
        raw: LocalStorage.Directory;
    };
    type Error = {
        type: Type.error;
        msg: string;
    };
}
