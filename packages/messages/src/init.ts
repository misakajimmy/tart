import {TartInit} from '@tartjs/core/lib/common';

export class MessagesInit implements TartInit {
  static async init(): Promise<any[]> {
    const core = new MessagesInit();
    return core.initContainer();
  }

  async initContainer(): Promise<any[]> {
    let modules = [];
    const messageFrontendModule = await import('./browser/message-frontend-module');
    modules.push(messageFrontendModule);
    return modules;
  }
}

export default MessagesInit;
