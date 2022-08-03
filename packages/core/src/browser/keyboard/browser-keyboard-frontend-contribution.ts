/********************************************************************************
 * Copyright (C) 2019 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import {injectable} from 'inversify';
import {Command, CommandContribution, CommandRegistry} from '../../common/command';
// import {BrowserKeyboardLayoutProvider, KeyboardLayoutData} from './browser-keyboard-layout-provider';

export namespace KeyboardCommands {

  const KEYBOARD_CATEGORY = 'Keyboard';
  const KEYBOARD_CATEGORY_KEY = KEYBOARD_CATEGORY;

  export const CHOOSE_KEYBOARD_LAYOUT = Command.toLocalizedCommand({
    id: 'core.keyboard.choose',
    category: KEYBOARD_CATEGORY,
    label: 'Choose Keyboard Layout',
  }, 'wm/core/keyboard/choose', KEYBOARD_CATEGORY_KEY);

}

@injectable()
export class BrowserKeyboardFrontendContribution implements CommandContribution {

  // @inject(BrowserKeyboardLayoutProvider)
  // protected readonly layoutProvider: BrowserKeyboardLayoutProvider;

  // @inject(QuickInputService) @optional()
  // protected readonly quickInputService: QuickInputService;

  registerCommands(commandRegistry: CommandRegistry): void {
    commandRegistry.registerCommand(KeyboardCommands.CHOOSE_KEYBOARD_LAYOUT, {
      execute: () => console.log('core.keyboard.choose')
    });
  }

  // protected async chooseLayout(): Promise<KeyboardLayoutData | undefined> {
  // const current = this.layoutProvider.currentLayoutData;
  // const autodetect: QuickPickValue<'autodetect'> = {
  //     label: 'Auto-detect',
  //     description: this.layoutProvider.currentLayoutSource !== 'user-choice' ? current.name : undefined,
  //     detail: 'Try to detect the keyboard layout from browser information and pressed keys.',
  //     value: 'autodetect'
  // };
  // const pcLayouts = this.layoutProvider.allLayoutData
  //     .filter(layout => layout.hardware === 'pc')
  //     .sort((a, b) => compare(a.name, b.name))
  //     .map(layout => this.toQuickPickValue(layout, current === layout));
  // const macLayouts = this.layoutProvider.allLayoutData
  //     .filter(layout => layout.hardware === 'mac')
  //     .sort((a, b) => compare(a.name, b.name))
  //     .map(layout => this.toQuickPickValue(layout, current === layout));
  // let layouts: Array<QuickPickValue<KeyboardLayoutData | 'autodetect'> | QuickPickItem>;
  // const macKeyboards = 'Mac Keyboards';
  // const pcKeyboards = 'PC Keyboards';
  // if (isOSX) {
  //     layouts = [
  //         autodetect,
  //         {type: 'separator', label: macKeyboards}, ...macLayouts,
  //         {type: 'separator', label: pcKeyboards}, ...pcLayouts
  //     ];
  // } else {
  //     layouts = [
  //         autodetect,
  //         {type: 'separator', label: pcKeyboards}, ...pcLayouts,
  //         {type: 'separator', label: macKeyboards}, ...macLayouts
  //     ];
  // }
  // const selectedItem = await this.quickInputService?.showQuickPick(layouts, {placeholder: 'Choose a keyboard layout'});
  // if (selectedItem && ('value' in selectedItem)) {
  //     return this.layoutProvider.setLayoutData(selectedItem.value);
  // }
  // }

  // protected toQuickPickValue(layout: KeyboardLayoutData, isCurrent: boolean): QuickPickValue<KeyboardLayoutData> {
  //     return {
  //         label: layout.name,
  //         description:
  //             `${layout.hardware === 'mac' ? 'Mac' : 'PC'} (${layout.language})${isCurrent ? ' - current layout' : ''}`,
  //         value: layout
  //     };
  // }
}

function compare(a: string, b: string): number {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}
