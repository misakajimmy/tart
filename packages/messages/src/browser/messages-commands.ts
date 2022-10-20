import {nls} from '@tartjs/core/lib/common/nls';
import {Command} from '@tartjs/core/lib/common';
import {codicon} from '@tartjs/core';

export namespace MessagesCommands {

  const MESSAGES_CATEGORY = 'Messages';
  const MESSAGES_CATEGORY_KEY = nls.getDefaultKey(MESSAGES_CATEGORY);

  export const TOGGLE = Command.toLocalizedCommand({
    id: 'notifications.commands.toggle',
    category: MESSAGES_CATEGORY,
    iconClass: codicon('list-unordered'),
    label: 'Toggle Notifications'
  }, 'tart/messages/toggleNotifications', MESSAGES_CATEGORY_KEY);

  export const SHOW = Command.toLocalizedCommand({
    id: 'notifications.commands.show',
    category: MESSAGES_CATEGORY,
    label: 'Show Notifications'
  });

  export const HIDE = Command.toLocalizedCommand({
    id: 'notifications.commands.hide',
    category: MESSAGES_CATEGORY,
    label: 'Hide Notifications'
  });

  export const CLEAR_ALL = Command.toLocalizedCommand({
    id: 'notifications.commands.clearAll',
    category: MESSAGES_CATEGORY,
    iconClass: codicon('clear-all'),
    label: 'Clear All Notifications'
  });
}
