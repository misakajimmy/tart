import '../style/index.css';

import {ContainerModule} from 'inversify';
import {FrontendApplicationContribution, KeybindingContribution} from '@tartjs/core';
import {CommandContribution, MessageClient} from '@tartjs/core/lib/common';
import {MessagesContribution} from './messages-contribution';
import {MessageManager} from './message-manager';
import {MessageContentRenderer} from './message-content-renderer';
import {MessagesRenderer} from './messages-renderer';
import {ColorContribution} from '@tartjs/core/lib/browser/color-application-contribution';

export const MessageFrontendModule = new ContainerModule((bind, unbind, isBound, rebind) => {
  bind(MessagesContribution).toSelf().inSingletonScope();
  bind(MessageManager).toSelf().inSingletonScope();
  bind(MessageContentRenderer).toSelf().inSingletonScope();
  bind(MessagesRenderer).toSelf().inSingletonScope();
  for (const identifier of [FrontendApplicationContribution, CommandContribution, KeybindingContribution, ColorContribution]) {
    bind(identifier).toService(MessagesContribution);
  }
  rebind(MessageClient).toService(MessageManager);
});

export default MessageFrontendModule;
