import {inject, injectable} from 'inversify';
import {ApplicationShell, KeybindingContext} from '@tart/core';
import {FileNavigatorWidget} from './navigator-widget';

export namespace NavigatorKeybindingContexts {
  export const navigatorActive = 'navigatorActive';
}

@injectable()
export class NavigatorActiveContext implements KeybindingContext {

  readonly id: string = NavigatorKeybindingContexts.navigatorActive;

  @inject(ApplicationShell)
  protected readonly applicationShell: ApplicationShell;

  isEnabled(): boolean {
    return this.applicationShell.activeWidget instanceof FileNavigatorWidget;
  }
}
