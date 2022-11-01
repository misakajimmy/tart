import React from 'react';
import {inject, injectable, postConstruct} from 'inversify';
import {ApplicationShell, CorePreferences} from '@tartjs/core';
import {MessageManager} from './message-manager';
import {NotificationToastsComponent} from './notification-toasts-component';
import {NotificationCenterComponent} from './notification-center-component';
import {createRoot, Root} from 'react-dom/client';

@injectable()
export class MessagesRenderer {
  @inject(ApplicationShell)
  protected readonly shell: ApplicationShell;

  @inject(MessageManager)
  protected readonly manager: MessageManager;

  @inject(CorePreferences)
  protected readonly corePreferences: CorePreferences;
  protected containerRoot: Root;

  @postConstruct()
  protected init(): void {
    this.createOverlayContainer();
    this.render();
  }

  protected container: HTMLDivElement;

  protected createOverlayContainer(): void {
    this.container = window.document.createElement('div');
    this.container.className = 'theia-notifications-overlay';
    if (window.document.body) {
      window.document.body.appendChild(this.container);
    }
    this.containerRoot = createRoot(this.container);
  }


  protected render(): void {
    this.containerRoot.render(<div>
      <NotificationToastsComponent manager={this.manager} corePreferences={this.corePreferences} />
      <NotificationCenterComponent manager={this.manager} />
    </div>);
  }
}
