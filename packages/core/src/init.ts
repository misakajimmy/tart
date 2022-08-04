import {TartInit} from './common';

export class CoreInit implements TartInit {
  static async init(): Promise<any[]> {
    const core = new CoreInit();
    return core.initContainer();
  }

  async initContainer(): Promise<any[]> {
    let modules = [];
    const frontendApplication = await import('@tart/core/lib/browser/frontend-application-module.js');
    modules.push(frontendApplication);
    const browserMenu = await import('@tart/core/lib/browser/menu/browser-menu-module.js');
    modules.push(browserMenu);
    const browserWindow = await import('@tart/core/lib/browser/window/browser-window-module.js');
    modules.push(browserWindow);
    const browserKeyboard = await import('@tart/core/lib/browser/keyboard/browser-keyboard-module.js');
    modules.push(browserKeyboard);
    return modules;
  }
}

export default CoreInit;
