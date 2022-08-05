import {TartInit} from '@tart/core/lib/common';

export class CoreInit implements TartInit {
  static async init(): Promise<any[]> {
    const core = new CoreInit();
    return core.initContainer();
  }

  async initContainer(): Promise<any[]> {
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

export default CoreInit;
