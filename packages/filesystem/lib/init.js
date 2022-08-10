export class FilesystemInit {
    static async init() {
        const core = new FilesystemInit();
        return core.initContainer();
    }
    async initContainer() {
        let modules = [];
        const filesystemFrontend = await import('./browser/filesystem-frontend-module');
        modules.push(filesystemFrontend);
        const fileDialog = await import('./browser/file-dialog/file-dialog-module');
        modules.push(fileDialog);
        const fileDownloadFrontend = await import('./browser/download/file-download-frontend-module');
        modules.push(fileDownloadFrontend);
        return modules;
    }
}
export default FilesystemInit;

//# sourceMappingURL=../lib/init.js.map
