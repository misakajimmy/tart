/********************************************************************************
 * Copyright (C) 2017 TypeFox and others.
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
import { Widget } from '@lumino/widgets';
import { Message } from '@lumino/messaging';
import { Event } from '../common/event';
import { MaybePromise } from '../common/types';
import { AbstractDialog } from './dialogs';
export interface Saveable {
    readonly dirty: boolean;
    readonly onDirtyChanged: Event<void>;
    readonly autoSave: 'on' | 'off';
    /**
     * Saves dirty changes.
     */
    save(options?: SaveOptions): MaybePromise<void>;
    /**
     * Reverts dirty changes.
     */
    revert?(options?: Saveable.RevertOptions): Promise<void>;
    /**
     * Creates a snapshot of the dirty state.
     */
    createSnapshot?(): object;
    /**
     * Applies the given snapshot to the dirty state.
     */
    applySnapshot?(snapshot: object): void;
}
export interface SaveableSource {
    readonly saveable: Saveable;
}
export declare namespace Saveable {
    interface RevertOptions {
        /**
         * If soft then only dirty flag should be updated, otherwise
         * the underlying data should be reverted as well.
         */
        soft?: boolean;
    }
    function isSource(arg: any): arg is SaveableSource;
    function is(arg: any): arg is Saveable;
    function get(arg: any): Saveable | undefined;
    function getDirty(arg: any): Saveable | undefined;
    function isDirty(arg: any): boolean;
    function save(arg: any, options?: SaveOptions): Promise<void>;
    function apply(widget: Widget): SaveableWidget | undefined;
    function shouldSave(saveable: Saveable, cb: () => MaybePromise<boolean | undefined>): Promise<boolean | undefined>;
}
export interface SaveableWidget extends Widget {
    closeWithoutSaving(): Promise<void>;
    closeWithSaving(options?: SaveableWidget.CloseOptions): Promise<void>;
}
export declare namespace SaveableWidget {
    function is(widget: Widget | undefined): widget is SaveableWidget;
    function getDirty<T extends Widget>(widgets: Iterable<T>): IterableIterator<SaveableWidget & T>;
    function get<T extends Widget>(widgets: Iterable<T>, filter?: (widget: T) => boolean): IterableIterator<SaveableWidget & T>;
    interface CloseOptions {
        shouldSave?(): MaybePromise<boolean | undefined>;
    }
}
/**
 * Possible formatting types when saving.
 */
export declare const enum FormatType {
    /**
     * Formatting should occur (default).
     */
    ON = 1,
    /**
     * Formatting should not occur.
     */
    OFF = 2,
    /**
     * Formatting should only occur if the resource is dirty.
     */
    DIRTY = 3
}
export interface SaveOptions {
    /**
     * Formatting type to apply when saving.
     */
    readonly formatType?: FormatType;
}
export declare function setDirty(widget: Widget, dirty: boolean): void;
export declare class ShouldSaveDialog extends AbstractDialog<boolean> {
    protected shouldSave: boolean;
    protected readonly dontSaveButton: HTMLButtonElement;
    constructor(widget: Widget);
    get value(): boolean;
    protected appendDontSaveButton(): HTMLButtonElement;
    protected onAfterAttach(msg: Message): void;
}
