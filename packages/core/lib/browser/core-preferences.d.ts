/********************************************************************************
 * Copyright (C) 2018 Google and others.
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
import { interfaces } from 'inversify';
import { PreferenceProxy, PreferenceSchema, PreferenceService } from './preferences';
export declare const corePreferenceSchema: PreferenceSchema;
export interface CoreConfiguration {
    'application.confirmExit': 'never' | 'ifRequired' | 'always';
    'breadcrumbs.enabled': boolean;
    'files.encoding': string;
    'keyboard.dispatch': 'code' | 'keyCode';
    'window.menuBarVisibility': 'classic' | 'visible' | 'hidden' | 'compact';
    'workbench.list.openMode': 'singleClick' | 'doubleClick';
    'workbench.commandPalette.history': number;
    'workbench.editor.highlightModifiedTabs': boolean;
    'workbench.editor.closeOnFileDelete': boolean;
    'workbench.colorTheme': string;
    'workbench.iconTheme': string | null;
    'workbench.silentNotifications': boolean;
    'workbench.statusBar.visible': boolean;
    'workbench.tree.renderIndentGuides': 'onHover' | 'none' | 'always';
    'workbench.hover.delay': number;
}
export declare const CorePreferenceContribution: unique symbol;
export declare const CorePreferences: unique symbol;
export declare type CorePreferences = PreferenceProxy<CoreConfiguration>;
export declare function createCorePreferences(preferences: PreferenceService, schema?: PreferenceSchema): CorePreferences;
export declare function bindCorePreferences(bind: interfaces.Bind): void;
