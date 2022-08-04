export declare const init_fs: () => void;
export declare const load_fs: () => any;
export declare const get_new_id: () => LocalStorage.Id;
export declare const new_file: (name: string, parent: LocalStorage.Parent, data: LocalStorage.Data) => LocalStorage.File;
export declare const new_directory: (name: string, parent: LocalStorage.Parent, data: LocalStorage.Data) => LocalStorage.Directory;
export declare const get_fs_type: (id: LocalStorage.Id) => LocalStorage.Type | LocalStorage.Error;
export declare const read_file: (id: LocalStorage.Id) => LocalStorage.File | undefined;
export declare const read_directory: (id: LocalStorage.Id) => LocalStorage.Directory | undefined;
export declare const write_file: (id: LocalStorage.Id, file: LocalStorage.File) => void;
export declare const write_file_data: (id: LocalStorage.Id, data: LocalStorage.Data) => void;
export declare const write_directory: (id: LocalStorage.Id, directory: LocalStorage.Directory) => void;
export declare const add_file_to_dir: (id: LocalStorage.Id, new_file: LocalStorage.File) => LocalStorage.Id;
export declare const add_dir_to_dir: (id: LocalStorage.Id, new_dir: LocalStorage.Directory) => LocalStorage.Id;
export declare const remove_file: (id: LocalStorage.Id, temp_ls: LocalStorage.FsList) => LocalStorage.FsList;
export declare const rename_dir: (id: LocalStorage.Id, newName: string) => LocalStorage.Id;
export declare const move_dir: (id: LocalStorage.Id, parent: LocalStorage.Id) => LocalStorage.Id;
export declare const remove_directory: (id: LocalStorage.Id, temp_ls: LocalStorage.FsList) => LocalStorage.FsList;
export declare namespace LocalStorage {
    type Id = number;
    enum Type {
        file = 0,
        directory = 1,
        error = 2
    }
    type Parent = number;
    type Children = Directory | File;
    type Data = string | object;
    type FsList = Children[];
    type File = {
        type: Type.file;
        name: string;
        parent: Parent;
        data: Data;
    };
    type Directory = {
        type: Type.directory;
        name: string;
        parent: Parent;
        children: Id[];
        data: Data;
    };
    interface Error {
        type: Type.error;
    }
}
