import {TartInit} from '@tartjs/core/lib/common';

export class MonacoInit implements TartInit {
  static async init(): Promise<any[]> {
    const core = new MonacoInit();
    return core.initContainer();
  }

  async initContainer(): Promise<any[]> {
    let modules = [];
    const monacoBrowser = await import('./browser/monaco-browser-module');
    modules.push(monacoBrowser);
    return modules;
  }
}

export default MonacoInit;
