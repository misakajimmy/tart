import {TartInit} from '@tart/core/lib/common';

export class WorkspaceInit implements TartInit {
  static async init(): Promise<any[]> {
    const core = new WorkspaceInit();
    return core.initContainer();
  }

  async initContainer(): Promise<any[]> {
    let modules = [];
    const workspaceFrontend = await import('./browser/workspace-frontend-module');
    modules.push(workspaceFrontend);
    return modules;
  }
}

export default WorkspaceInit;
