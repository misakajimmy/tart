/********************************************************************************
 * Copyright (C) 2018 TypeFox and others.
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

/* eslint-disable @typescript-eslint/no-explicit-any */

import {ReactNode} from 'react';
import {injectable, unmanaged} from 'inversify';
import {Emitter, Event} from '../../common';
import {MaybePromise} from '../../common/types';
import {Disposable, DisposableCollection} from '../../common/disposable';

export interface TreeElement {
  /** default: parent id + position among siblings */
  readonly id?: number | string | undefined
  /** default: true */
  readonly visible?: boolean

  render(): ReactNode

  open?(): MaybePromise<any>
}

export interface CompositeTreeElement extends TreeElement {
  /** default: true */
  readonly hasElements?: boolean

  getElements(): MaybePromise<IterableIterator<TreeElement>>
}

export namespace CompositeTreeElement {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  export function is(element: CompositeTreeElement | any): element is CompositeTreeElement {
    return !!element && 'getElements' in element;
  }

  export function hasElements(element: CompositeTreeElement | any): element is CompositeTreeElement {
    return is(element) && element.hasElements !== false;
  }
}

@injectable()
export abstract class TreeSource implements Disposable {
  readonly id: string | undefined;
  readonly placeholder: string | undefined;
  protected readonly onDidChangeEmitter = new Emitter<void>();
  readonly onDidChange: Event<void> = this.onDidChangeEmitter.event;
  protected readonly toDispose = new DisposableCollection(this.onDidChangeEmitter);

  constructor(@unmanaged() options: TreeSourceOptions = {}) {
    this.id = options.id;
    this.placeholder = options.placeholder;
  }

  dispose(): void {
    this.toDispose.dispose();
  }

  abstract getElements(): MaybePromise<IterableIterator<TreeElement>>;

  protected fireDidChange(): void {
    this.onDidChangeEmitter.fire(undefined);
  }
}

export interface TreeSourceOptions {
  id?: string
  placeholder?: string
}
