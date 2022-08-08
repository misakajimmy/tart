import {TartInit} from '@tart/core/lib/common';

export class NavigatorInit implements TartInit {
  static async init(): Promise<any[]> {
    const core = new NavigatorInit();
    return core.initContainer();
  }

  async initContainer(): Promise<any[]> {
    let modules = [];
    // const monacoBrowser = await import('./browser/navigator-frontend-module');
    // modules.push(monacoBrowser);
    return modules;
  }
}

export default NavigatorInit;
