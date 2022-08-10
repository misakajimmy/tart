import {TartInit} from '@tartjs/core/lib/common';

export class EditorInit implements TartInit {
  static async init(): Promise<any[]> {
    const core = new EditorInit();
    return core.initContainer();
  }

  async initContainer(): Promise<any[]> {
    let modules = [];
    const editorFrontend = await import('./browser/editor-frontend-module');
    modules.push(editorFrontend);
    return modules;
  }
}

export default EditorInit;
