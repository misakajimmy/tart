import {inject, injectable} from 'inversify';
import {
  FrontendApplication,
  FrontendApplicationContribution,
  KeybindingContribution,
  KeybindingRegistry,
  StatusBar,
  StatusBarAlignment
} from '@tartjs/core';
import {CommandContribution, CommandRegistry, MessageService} from '@tartjs/core/lib/common';
import {MessageManager} from './message-manager';
import {MessagesCommands} from './messages-commands';
import {nls} from '@tartjs/core/lib/common/nls';
import {MessagesRenderer} from './messages-renderer';
import {Color} from '@tartjs/core/lib/common/color';
import {ColorRegistry} from '@tartjs/core/lib/browser/color-registry';
import {ColorContribution} from '@tartjs/core/lib/browser/color-application-contribution';

@injectable()
export class MessagesContribution implements FrontendApplicationContribution, CommandContribution, KeybindingContribution, ColorContribution {

  protected readonly id = 'tart-notification-center';

  @inject(MessageManager)
  protected readonly manager: MessageManager;

  @inject(MessagesRenderer)
  protected readonly messagesRenderer: MessagesRenderer;

  @inject(StatusBar)
  protected readonly statusBar: StatusBar;

  registerCommands(commands: CommandRegistry): void {
    commands.registerCommand(MessagesCommands.TOGGLE, {
      isEnabled: () => true,
      execute: () => this.manager.toggleCenter()
    });
    commands.registerCommand(MessagesCommands.SHOW, {
      isEnabled: () => true,
      execute: () => this.manager.showCenter()
    });
    commands.registerCommand(MessagesCommands.HIDE, {
      execute: () => this.manager.hide()
    });
    commands.registerCommand(MessagesCommands.CLEAR_ALL, {
      execute: () => this.manager.clearAll()
    });
  }

  registerKeybindings(keybindings: KeybindingRegistry): void {
    keybindings.registerKeybinding({
      command: MessagesCommands.HIDE.id,
      context: MessagesKeybindingContext.messageVisible,
      keybinding: 'esc'
    });
  }

  registerColors(colors: ColorRegistry): void {
    colors.register(
      {
        id: 'notificationCenter.border', defaults: {
          hc: 'contrastBorder'
        }, description: 'Notifications center border color. Notifications slide in from the bottom right of the window.'
      },
      {
        id: 'notificationToast.border', defaults: {
          hc: 'contrastBorder'
        }, description: 'Notification toast border color. Notifications slide in from the bottom right of the window.'
      },
      {
        id: 'notifications.foreground', defaults: {
          dark: 'editorWidget.foreground',
          light: 'editorWidget.foreground',
          hc: 'editorWidget.foreground'
        }, description: 'Notifications foreground color. Notifications slide in from the bottom right of the window.'
      },
      {
        id: 'notifications.background', defaults: {
          dark: 'editorWidget.background',
          light: 'editorWidget.background',
          hc: 'editorWidget.background'
        }, description: 'Notifications background color. Notifications slide in from the bottom right of the window.'
      },
      {
        id: 'notificationLink.foreground',
        defaults: {
          dark: 'textLink.foreground',
          light: 'textLink.foreground',
          hc: 'textLink.foreground'
        },
        description: 'Notification links foreground color. Notifications slide in from the bottom right of the window.'
      },
      {
        id: 'notificationCenterHeader.foreground',
        description: 'Notifications center header foreground color. Notifications slide in from the bottom right of the window.'
      },
      {
        id: 'notificationCenterHeader.background',
        defaults: {
          dark: Color.lighten('notifications.background', 0.3),
          light: Color.darken('notifications.background', 0.05),
          hc: 'notifications.background'
        },
        description: 'Notifications center header background color. Notifications slide in from the bottom right of the window.'
      },
      {
        id: 'notifications.border',
        defaults: {
          dark: 'notificationCenterHeader.background',
          light: 'notificationCenterHeader.background',
          hc: 'notificationCenterHeader.background'
          // eslint-disable-next-line max-len
        },
        description: 'Notifications border color separating from other notifications in the notifications center. Notifications slide in from the bottom right of the window.'
      },
      {
        id: 'notificationsErrorIcon.foreground',
        defaults: {
          dark: 'editorError.foreground',
          light: 'editorError.foreground',
          hc: 'editorError.foreground'
        },
        description: 'The color used for the icon of error notifications. Notifications slide in from the bottom right of the window.'
      },
      {
        id: 'notificationsWarningIcon.foreground',
        defaults: {
          dark: 'editorWarning.foreground',
          light: 'editorWarning.foreground',
          hc: 'editorWarning.foreground'
        },
        description: 'The color used for the icon of warning notifications. Notifications slide in from the bottom right of the window.'
      },
      {
        id: 'notificationsInfoIcon.foreground',
        defaults: {
          dark: 'editorInfo.foreground',
          light: 'editorInfo.foreground',
          hc: 'editorInfo.foreground'
        },
        description: 'The color used for the icon of info notifications. Notifications slide in from the bottom right of the window.'
      }
    );
  }

  onStart(app: FrontendApplication): void {

    this.createStatusBarItem();
  }

  @inject(MessageService)
  protected readonly messageService: MessageService;

  protected createStatusBarItem(): void {
    this.updateStatusBarItem();
    this.manager.onUpdated(e => this.updateStatusBarItem(e.notifications.length));
  }

  protected updateStatusBarItem(count: number = 0): void {
    this.statusBar.setElement(this.id, {
      text: this.getStatusBarItemText(count),
      alignment: StatusBarAlignment.RIGHT,
      priority: -900,
      command: MessagesCommands.TOGGLE.id,
      tooltip: this.getStatusBarItemTooltip(count)
    });
  }

  protected getStatusBarItemText(count: number): string {
    return `$(${count ? 'codicon-bell-dot' : 'codicon-bell'}) ${count ? ` ${count}` : ''}`;
  }

  protected getStatusBarItemTooltip(count: number): string {
    if (this.manager.centerVisible) {
      return nls.localizeByDefault('Hide Notifications');
    }
    return count === 0
      ? nls.localizeByDefault('No Notifications')
      : count === 1
        ? nls.localizeByDefault('1 New Notification')
        : nls.localizeByDefault('{0} New Notifications', count.toString());
  }
}

export namespace MessagesKeybindingContext {
  export const messageVisible = 'messageVisible';
}
