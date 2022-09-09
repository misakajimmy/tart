import * as lfs from "./localstorage-fs";
import {LocalStorage, move_dir, rename_dir} from "./localstorage-fs";
import {FileChangeType} from '../files';

// @ts-ignore
let notifyDidChangeFile: ({changes: any}) => any;

/*
 *  fsPointer
 *  provides safe wrapper of fs access functions
 *  instead of directly working with id, use fsPointer and helper functions.
 */
export const fsPointer = (
    id: LocalStorage.Id,
): FS.FsPointer => {
  try {
    const ty = lfs.get_fs_type(id); // get file type
    // 1) file case
    if (ty == LocalStorage.Type.file) {
      const file = lfs.read_file(id);
      return {
        type: LocalStorage.Type.file,
        name: file.name,
        id: id,
        parent: () => fsPointer(file.parent),
        children: () => {
          return {type: LocalStorage.Type.error, msg: "file has no children"};
        },
        files: () => {
          return {type: LocalStorage.Type.error, msg: "file has no subfiles"};
        },
        dirs: () => {
          return {type: LocalStorage.Type.error, msg: "file has no subdirs"};
        },
        data: () => file.data,
        // TODO : safer access to this file
        raw: file,
      };
    }
    // 2) directory case
    else if (ty == LocalStorage.Type.directory) {
      const dir = lfs.read_directory(id);
      return {
        type: LocalStorage.Type.directory,
        name: dir.name,
        id: id,
        parent: () => fsPointer(dir.parent),
        children: () => {
          return dir.children.map((child) => fsPointer(child));
        },
        files: () => {
          return dir.children
              .filter((child) => lfs.get_fs_type(child) == LocalStorage.Type.file)
              .map((child) => fsPointer(child)) as FS.File[];
        },
        dirs: () => {
          return dir.children
              .filter((child) => lfs.get_fs_type(child) == LocalStorage.Type.directory)
              .map((child) => fsPointer(child)) as FS.Directory[];
        },
        // TODO : safer access to this dir
        raw: dir,
        data: () => dir.data,
      };
    }
  } catch (e) {
    // 3) error case
    return {
      type: LocalStorage.Type.error,
      msg: e.message,
    };
  }
};

export const movePointer = (
    from: FS.FsPointer,
    to: FS.FsPointer,
    name: string,
    resource: any,
) => {
    if (from.type !== FS.Type.error && to.type !== FS.Type.error) {
        move_dir(from.id, to.id);
        rename_dir(from.id, name);
        notifyDidChangeFile({changes: [{event: FileChangeType.UPDATED, resource: resource}]})
    }
}

// @ts-ignore
export const setNotifyDidChangeFile = (change: ({changes: any}) => any) => {
    notifyDidChangeFile = change;
}

////////////////////////////////////////////////////////////////////////////////
// fsPointer methods
////////////////////////////////////////////////////////////////////////////////

// get the root pointer
export const get_root_pointer = (): FS.Directory => {
    lfs.init_fs();
    return fsPointer(0) as FS.Directory; // root directory always reside in index 0
};

// error pointer
const error_pointer = (
    msg: string
): FS.Error => {
    return {
        type: FS.Type.error,
        msg: msg,
    };
};

const check_error = (fp: FS.FsPointer): boolean => {
    return (fp.type !== FS.Type.error);
}

////////////////////////////////////////////////////////////////////////////////
// getters
////////////////////////////////////////////////////////////////////////////////
export const get_file_list = (
    fp: FS.FsPointer
): FS.File[] => {
    if (fp.type === FS.Type.directory) {
        return fp.files();
    } else {
        return [];
    }
};

// getters for dir list
export const get_dir_list = (
    fp: FS.FsPointer
): FS.Directory[] => {
    if (fp.type === FS.Type.directory) {
        return fp.dirs();
    } else {
        return [];
    }
};

// given a pointer, get the file pointer given name
export const child_file_pointer = (fp, name) => {
    if (fp.type != LocalStorage.Type.directory) return error_pointer("not a dir pointer");
    if (fp.dirs().filter((p) => p.name == name).length > 0)
        return error_pointer("given name is dir");
    return fp.files().filter((p) => p.name == name)[0];
};

// given a pointer, get the dir pointer given name
export const child_dir_pointer = (fp, name) => {
    if (fp.type != LocalStorage.Type.directory) return error_pointer("not a dir pointer");
    if (fp.files().filter((p) => p.name == name).length > 0)
        return error_pointer("given name is file");
    return fp.dirs().filter((p) => p.name == name)[0];
};

// given a pointer, get the parent dir pointer
export const parent_dir_pointer = (fp) => {
    return fp.parent();
};

////////////////////////////////////////////////////////////////////////////////
// modifier fns
////////////////////////////////////////////////////////////////////////////////

// add file to given dir pointer
export const add_file_to_pointer = (fp, filename, filedata, resource) => {
    if (fp.type != LocalStorage.Type.directory) return error_pointer("not a dir pointer");
    if (fp.files().filter((p) => p.name == filename).length > 0) {
        return error_pointer(`file ${filename} already exist`);
    }
    let new_file = lfs.new_file(filename, fp.id, filedata);
    notifyDidChangeFile({changes: [{event: FileChangeType.ADDED, resource: resource}]})
    return fsPointer(lfs.add_file_to_dir(fp.id, new_file));
};

// add dir to given dir pointer
export const add_dir_to_pointer = (fp, dirname, dirdata, resource) => {
    if (fp.type != LocalStorage.Type.directory) return error_pointer("not a dir pointer");
    if (fp.dirs().filter((p) => p.name == dirname).length > 0) {
        return error_pointer(`dir ${dirname} already exist`);
    }
    let new_dir = lfs.new_directory(dirname, fp.id, dirdata);
    notifyDidChangeFile({changes: [{event: FileChangeType.ADDED, resource: resource}]})
    return fsPointer(lfs.add_dir_to_dir(fp.id, new_dir));
};

// remove file or directory of given pointer
export const remove_pointer = (fp, resource) => {

    let temp_ls = lfs.load_fs()
    if (fp.type == LocalStorage.Type.file) {
        lfs.remove_file(fp.id, temp_ls);
        notifyDidChangeFile({changes: [{event: FileChangeType.DELETED, resource: resource}]})
        return true;
    } else if (fp.type == LocalStorage.Type.directory) {
        lfs.remove_directory(fp.id, temp_ls);
        notifyDidChangeFile({changes: [{event: FileChangeType.DELETED, resource: resource}]})
        return true;
    } else return false; // TODO should return some id
};

// update file data of given pointer
export const update_data_file_pointer = (fp, filedata) => {
    if (fp.type != LocalStorage.Type.file) return false;
    let file = fp.raw;
    file.data = filedata;
    lfs.write_file(fp.id, file);
    return true; // TODO more error catching and returning written file id
};

////////////////////////////////////////////////////////////////////////////////
// parse the path
// assume: name of file or directory does not contain "/" character (except root)
// ex. "/a/b/c/d" : absolute path, root -> dir a -> dir b -> dir c -> (dir or file) d
// ex. "a/b/c/d" : relative path, fp -> dir a -> dir b -> dir c -> (dir or file) d
////////////////////////////////////////////////////////////////////////////////

export const get_path_pointer = (
    fp: FS.FsPointer,
    path: string
): FS.FsPointer | undefined => {
    if (fp.type != LocalStorage.Type.directory) return error_pointer("not a dir pointer");
    let splitted = path.split("/");
    // 1) absolute path case
    if (path.startsWith("/")) {
        let root = get_root_pointer();
        let relative_path = splitted.slice(1).join("/");
        return get_path_pointer(root, relative_path);
    }
    // 2) relative path case
    else {
        if (splitted.length == 1) {
            let file_result = child_file_pointer(fp, splitted[0]);
            if (file_result !== undefined && file_result.type == LocalStorage.Type.file) return file_result;
            else {
                let dir_result = child_dir_pointer(fp, splitted[0]);
                if (dir_result !== undefined && dir_result.type == LocalStorage.Type.directory) return dir_result;
                else return error_pointer("no such file or directory");
            }
        } else {
            let dir_result = child_dir_pointer(fp, splitted[0]);
            if (dir_result !== undefined && dir_result.type == LocalStorage.Type.directory) {
                return get_path_pointer(dir_result, splitted.slice(1).join("/"));
            } else {
                return error_pointer("no such directory");
            }
        }
    }
};

export const get_pointer = (
    fp: FS.FsPointer,
    path: string
): FS.FsPointer | undefined => {
    if (path === '/' || path === '') {
        return fp;
    } else {
        return get_path_pointer(fp, path);
    }
}

// get the path of a pointer
export const get_pointer_path = (fp) => {
    if (fp.type == LocalStorage.Type.directory && fp.name == "/") return "ROOT";
    else if (fp.type == LocalStorage.Type.directory || fp.type == LocalStorage.Type.file) {
        let parent_path = get_pointer_path(fp.parent());
        if (parent_path == "") return "";
        return parent_path + "/" + fp.name;
    } else return "";
};

////////////////////////////////////////////////////////////////////////////////
///////////////////////////////Main fns for memo-localstorage //////////////////
////////////////////////////////////////////////////////////////////////////////

export const get_file_data_list_by_data_predicate = (fp, predicate) => {
    let targetFileDatas = fp
        .files()
        .filter((fp) => predicate(fp.data()))
        .map((fp) => fp.data());
    return targetFileDatas;
};

export const get_file_data_list = (fp) => {
    return get_file_data_list_by_data_predicate(fp, (m) => true);
};

// modifiers for file pointers
export const delete_file_by_data_predicate = (fp, predicate, resource) => {
    let targetFiles = fp.files().filter((fp) => predicate(fp.data()));
    if (targetFiles.length == 0) return false;
    targetFiles.forEach((fp) => {
        remove_pointer(fp, resource);
    });
    return true;
};
export const delete_dir_by_data_predicate = (fp, predicate, resource) => {
    let targetDirs = fp.dirs().filter((fp) => predicate(fp.data()));
    if (targetDirs.length == 0) return false;
    targetDirs.forEach((fp) => {
        remove_pointer(fp, resource);
    });
    return true;
};


export const modify_file_data_by_data_predicate = (fp, predicate, newData) => {
    let targetFiles = fp.files().filter((fp) => predicate(fp.data()));
    if (targetFiles.length != 1) return false;
    update_data_file_pointer(targetFiles[0], newData);
    return true;
};

export const store_file_in_dir = (fp, name, data, uri) => {
    add_file_to_pointer(fp, name, data, uri);
};

export const reload_pointer = (fp) => {
    let id = fp.id;
    return fsPointer(id);
};

// directory related
export const get_dir_name_list = (fp) => {
    return get_dir_list(fp).map((p) => p.name);
};

export const get_dir_data_list = (fp) => {
    return get_dir_list(fp).map((p) => p.data());
};

export const store_dir_in_dir = (fp, name, data, resource) => {
    add_dir_to_pointer(fp, name, data, resource);
};

export const get_dir_by_name = (fp, name: string): FS.Directory | undefined => {
    let resPointer = child_dir_pointer(fp, name);
    if (resPointer === undefined) {
        return undefined;
    }
    if (resPointer.type !== undefined && resPointer.type != LocalStorage.Type.directory) return fp;
    else return resPointer;
};

export const get_parent_dir = (fp) => {
    let resPointer = parent_dir_pointer(fp);
    if (resPointer.type != LocalStorage.Type.directory) return fp;
    else return resPointer;
};

export const get_child_list = (fp: FS.FsPointer): FS.Combine[] => {
    const dirs = get_dir_list(fp);
    const files = get_file_list(fp);
    return [...dirs, ...files];
}

// export const get_file_with_path = (
//     uri: URI
// ): FS.Combine | undefined => {
//     let root = get_root_pointer();
//     console.log(root);
//     if (root.type === FS.Type.error) {
//         return;
//     }
//     let p = uri.path;
//     while (p.name !== '') {
//         root = get_dir_by_name(root, p.name);
//         if (root === undefined) {
//             return undefined;
//         }
//         p = p.dir;
//     }
//     return root;
// }

export namespace FS {
    export enum Type {
        file,
        directory,
        error,
    }

    export type Name = string;
    export type Id = LocalStorage.Id;

    export type Parent = (id: Id) => {};

    export type FsPointer = File | Directory | Error;
    export type Combine = File | Directory;

    export type File = {
        type: Type.file;
        name: Name;
        id: Id;
        parent: Parent;
        children: () => Error;
        files: () => Error;
        dirs: () => Error;
        data: () => LocalStorage.Data;
        raw: LocalStorage.File;
    }

    export type Directory = {
        type: Type.directory;
        name: Name;
        id: Id;
        parent: Parent;
        children: () => FsPointer[];
        files: () => File[];
        dirs: () => Directory[];
        data: () => LocalStorage.Data;
        raw: LocalStorage.Directory;
    }

    export type Error = {
        type: Type.error,
        msg: string,
    }
}
