// key used to access the localStorage

const fs_key = "local-fs";

// check if localStorage entry exists
// and correctly initialized with root directory
const check_fs = (): boolean => {
    if (localStorage.getItem(fs_key) === null) return false;
    let root = read_directory(0);
    if (root === undefined) {
        return false;
    }
    if (!(root.type == LocalStorage.Type.directory && (root as LocalStorage.Directory).name == "/")) return false;

    return true;
};

// initialize the fs
// if fs does not exist, add localStorage entry and add root directory.
export const init_fs = () => {
    if (!check_fs()) {
        let rootDir = new_directory("/", 0, {
            // parent of root = root
            type: LocalStorage.Type.directory,
            name: "/",
            createAt: new Date(),
        });
        write_directory(0, rootDir);
    }
};

// clear out the fs
const clear_fs = () => {
    localStorage.removeItem(fs_key);
    init_fs();
};

// load the file array from localStorage
export const load_fs = (): any => {
    return JSON.parse(localStorage.getItem(fs_key)) || [];
};

// store the given file arrya to localStorage
const store_fs = (fsList: LocalStorage.FsList) => {
    return localStorage.setItem(fs_key, JSON.stringify(fsList));
};

// get_new_id: finding new array index for allocation
// tries to find first empty cell,
// if such cell does not exist, the array is extended
export const get_new_id = (): LocalStorage.Id => {
    const fsList = load_fs();
    for (let i = 0; i < fsList.length; i++) {
        if (fsList[i] == undefined) {
            // empty element is undefined
            return i;
        }
    }
    return fsList.length; // else, return the length
};

////////////////////////////////////////////////////////////////////////////////
// Default object constructors of file / directory
////////////////////////////////////////////////////////////////////////////////

// default constructor for file object
// name: string, parent: id of parent dir, data: object
export const new_file = (
    name: string,
    parent: LocalStorage.Parent,
    data: LocalStorage.Data,
): LocalStorage.File => {
    return {
        type: LocalStorage.Type.file,
        name: name,
        parent: parent,
        data: data,
    };
};

// default constructor for directory
// name: string, parent: id of parent dir,
// children: array of id of children file / directory
export const new_directory = (
    name: string,
    parent: LocalStorage.Parent,
    data: LocalStorage.Data,
): LocalStorage.Directory => {
    return {
        type: LocalStorage.Type.directory,
        name: name,
        parent: parent,
        children: [],
        data: data,
    };
};

////////////////////////////////////////////////////////////////////////////////
// atomic fs access functions
////////////////////////////////////////////////////////////////////////////////
const NotFileError = new Error("Not a file");
const NotDirectoryError = new Error("Not a directory");
const NotExistError = new Error("Not exist");
const AlreadyExistError = new Error("Already exist");

// Implementation Detail
// each funciton start with load_fs, end with store_fs, each exactly once
// (except read functions)
// think fsList as "cache" of the actual fs inside the localStorage

// return file type at id
export const get_fs_type = (
    id: LocalStorage.Id
): LocalStorage.Type | LocalStorage.Error => {
    let fsList = load_fs();
    let loaded = fsList[id] || {type: LocalStorage.Type.error};
    return loaded.type;
};

// return file at id
export const read_file = (
    id: LocalStorage.Id
): LocalStorage.File | undefined => {
    let fsList = load_fs();
    let loaded = fsList[id] || {type: LocalStorage.Type.error};
    if (loaded.type != LocalStorage.Type.file) {
        return undefined;
    }
    return loaded;
};

// return directory at id
export const read_directory = (
    id: LocalStorage.Id
): LocalStorage.Directory | undefined => {
    let fsList = load_fs();
    let loaded = fsList[id] || {type: LocalStorage.Type.error};
    if (loaded.type != LocalStorage.Type.directory) {
        return undefined;
    }
    return loaded as LocalStorage.Directory;
};

// write a file at id
export const write_file = (
    id: LocalStorage.Id,
    file: LocalStorage.File
) => {
    if (file.type != LocalStorage.Type.file) {
        throw NotFileError;
    }
    let fsList = load_fs();
    fsList[id] = file;
    store_fs(fsList);
};

// write file, but only changing data
export const write_file_data = (
    id: LocalStorage.Id,
    data: LocalStorage.Data,
) => {
    let fsList = load_fs();
    let file = fsList[id] || {type: LocalStorage.Type.error};
    if (file.type != LocalStorage.Type.file) {
        throw NotFileError;
    }
    file.data = data;
    store_fs(fsList);
};

// write directory at id
export const write_directory = (
    id: LocalStorage.Id,
    directory: LocalStorage.Directory
) => {
    if (directory.type != LocalStorage.Type.directory) {
        throw NotDirectoryError;
    }
    let fsList = load_fs();
    fsList[id] = directory;
    store_fs(fsList);
};

////////////////////////////////////////////////////////////////////////////////
// adding new files / directories under directory
////////////////////////////////////////////////////////////////////////////////

// add file to directory at id
// also assigns new id to file
// return id of new file
export const add_file_to_dir = (
    id: LocalStorage.Id,
    new_file: LocalStorage.File
): LocalStorage.Id => {
    let fsList = load_fs();
    // check directory
    let dir = fsList[id] || {type: LocalStorage.Type.error};
    if (dir.type != LocalStorage.Type.directory) {
        throw NotDirectoryError;
    }
    let new_id = get_new_id();
    fsList[new_id] = new_file;
    (dir as LocalStorage.Directory).children.push(new_id);
    store_fs(fsList);
    return new_id;
};

// add directory to directory at id
// also assigns new id to file
// return id of new dir
export const add_dir_to_dir = (
    id: LocalStorage.Id,
    new_dir: LocalStorage.Directory
): LocalStorage.Id => {
    let fsList = load_fs();
    let dir = fsList[id] || {type: LocalStorage.Type.error};
    if (dir.type != LocalStorage.Type.directory) {
        throw NotDirectoryError;
    }
    let new_id = get_new_id();
    fsList[new_id] = new_dir;
    (dir as LocalStorage.Directory).children.push(new_id);
    store_fs(fsList);
    return new_id;
};

////////////////////////////////////////////////////////////////////////////////
// remove file at id
////////////////////////////////////////////////////////////////////////////////

export const remove_file = (
    id: LocalStorage.Id,
    temp_ls: LocalStorage.FsList
): LocalStorage.FsList => {

    let deleted_temp_ls = temp_ls

    let file = temp_ls[id] || {type: LocalStorage.Type.error};
    if (file.type != LocalStorage.Type.file) {
        throw NotFileError;
    }
    // 1) delete link to this child from parent
    let parent = temp_ls[file.parent] || {type: LocalStorage.Type.error};
    if (parent.type != LocalStorage.Type.directory) {
        throw NotDirectoryError;
    }
    parent.children = parent.children.filter((child) => child != id);
    // 2) actually delete
    delete deleted_temp_ls[id];
    store_fs(deleted_temp_ls);
    return deleted_temp_ls
};

export const rename_dir = (
    id: LocalStorage.Id,
    newName: string
): LocalStorage.Id => {
    let fsList = load_fs();
    fsList[id].name = newName;
    store_fs(fsList);
    return id;
};

export const move_dir = (
    id: LocalStorage.Id,
    parent: LocalStorage.Id,
): LocalStorage.Id => {
    let fsList = load_fs();
    if (fsList[fsList[id].parent].children !== undefined) {
        fsList[fsList[id].parent].children = fsList[fsList[id].parent].children.filter(child => child !== id);
    }
    fsList[id].parent = parent;
    if (fsList[parent].children !== undefined) {
        fsList[parent].children.push(id);
    }
    store_fs(fsList);
    return id;
}

// remove directory at id
export const remove_directory = (
    id: LocalStorage.Id,
    temp_ls: LocalStorage.FsList
): LocalStorage.FsList => {

    let deleted_temp_ls = temp_ls
    let directory = temp_ls[id] || {type: LocalStorage.Type.error};
    if (directory.type != LocalStorage.Type.directory) {
        throw NotDirectoryError;
    }
    let parent = temp_ls[directory.parent] || {type: LocalStorage.Type.error};
    if (parent.type != LocalStorage.Type.directory) {
        throw NotDirectoryError;
    }
    parent.children = parent.children.filter((child) => child != id);
    // recursively delete all children

    (directory as LocalStorage.Directory).children.forEach((child) => {
        if (temp_ls[child].type == LocalStorage.Type.file) {
            deleted_temp_ls = remove_file(child, temp_ls);
        } else if (temp_ls[child].type == LocalStorage.Type.directory) {
            deleted_temp_ls = remove_directory(child, temp_ls);
        }
    });
    // finally delete the directory

    delete deleted_temp_ls[id];

    store_fs(deleted_temp_ls);
    return deleted_temp_ls
};

export namespace LocalStorage {
    export type Id = number;

    export enum Type {
        file,
        directory,
        error,
    }

    export type Parent = number;
    export type Children = Directory | File;
    export type Data = string | object;

    export type FsList = Children[];

    export type File = {
        type: Type.file,
        name: string,
        parent: Parent,
        data: Data,
    }

    export type Directory = {
        type: Type.directory,
        name: string,
        parent: Parent,
        children: Id[]
        data: Data,
    }

    export interface Error {
        type: Type.error,
    }
}
