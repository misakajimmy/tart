import React from 'react';
import ReactDOM from 'react-dom';
import {inject, injectable, postConstruct} from 'inversify';
import {ApplicationShell, CorePreferences} from '@tartjs/core';
import {MessageManager} from './message-manager';
import {NotificationToastsComponent} from './notification-toasts-component';
import {NotificationCenterComponent} from './notification-center-component';

@injectable()
export class MessagesRenderer {
  @inject(ApplicationShell)
  protected readonly shell: ApplicationShell;

  @inject(MessageManager)
  protected readonly manager: MessageManager;

  @inject(CorePreferences)
  protected readonly corePreferences: CorePreferences;

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
  }

  protected render(): void {
    ReactDOM.render(
      <div>
        <NotificationToastsComponent
          manager={this.manager}
          corePreferences={this.corePreferences}
        />
        <NotificationCenterComponent
          manager={this.manager}
        />
      </div>,
      this.container
    );
  }

}
