/********************************************************************************
 * Copyright (C) 2017-2018 TypeFox and others.
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import * as React from 'react';
import { inject, injectable } from 'inversify';
import { CommandService } from '../../common';
import { ReactWidget } from '../widgets';
import { FrontendApplicationStateService } from '../frontend-application-state';
import { LabelIcon, LabelParser } from '../label-parser';
export var StatusBarAlignment;
(function (StatusBarAlignment) {
    StatusBarAlignment[StatusBarAlignment["LEFT"] = 0] = "LEFT";
    StatusBarAlignment[StatusBarAlignment["RIGHT"] = 1] = "RIGHT";
})(StatusBarAlignment || (StatusBarAlignment = {}));
export const STATUSBAR_WIDGET_FACTORY_ID = 'statusBar';
export const StatusBar = Symbol('StatusBar');
let StatusBarImpl = class StatusBarImpl extends ReactWidget {
    commands;
    entryService;
    applicationStateService;
    backgroundColor;
    color;
    entries = new Map();
    constructor(commands, entryService, applicationStateService) {
        super();
        this.commands = commands;
        this.entryService = entryService;
        this.applicationStateService = applicationStateService;
        delete this.scrollOptions;
        this.id = 'tart-statusBar';
        this.addClass('noselect');
        // Hide the status bar until the `workbench.statusBar.visible` preference returns with a `true` value.
        this.hide();
        this.setHidden(false);
    }
    get ready() {
        return this.applicationStateService.reachedAnyState('initialized_layout', 'ready');
    }
    async setElement(id, entry) {
        await this.ready;
        this.entries.set(id, entry);
        this.update();
    }
    async removeElement(id) {
        await this.ready;
        this.entries.delete(id);
        this.update();
    }
    async setBackgroundColor(color) {
        await this.ready;
        this.internalSetBackgroundColor(color);
        this.update();
    }
    async setColor(color) {
        await this.ready;
        this.internalSetColor(color);
        this.update();
    }
    internalSetBackgroundColor(color) {
        this.backgroundColor = color;
        this.node.style.backgroundColor = this.backgroundColor || '';
    }
    internalSetColor(color) {
        this.color = color;
    }
    render() {
        const leftEntries = [];
        const rightEntries = [];
        const elements = Array.from(this.entries).sort((left, right) => {
            const lp = left[1].priority || 0;
            const rp = right[1].priority || 0;
            return rp - lp;
        });
        elements.forEach(([id, entry]) => {
            if (entry.alignment === StatusBarAlignment.LEFT) {
                leftEntries.push(this.renderElement(id, entry));
            }
            else {
                rightEntries.push(this.renderElement(id, entry));
            }
        });
        return React.createElement(React.Fragment, null,
            React.createElement("div", { className: 'area left' }, leftEntries),
            React.createElement("div", { className: 'area right' }, rightEntries));
    }
    onclick(entry) {
        return () => {
            if (entry.command) {
                const args = entry.arguments || [];
                this.commands.executeCommand(entry.command, ...args);
            }
        };
    }
    createAttributes(entry) {
        const attrs = {};
        if (entry.command) {
            attrs.onClick = this.onclick(entry);
            attrs.className = 'element hasCommand';
        }
        else if (entry.onclick) {
            attrs.onClick = e => {
                if (entry.onclick) {
                    entry.onclick(e);
                }
            };
            attrs.className = 'element hasCommand';
        }
        else {
            attrs.className = 'element';
        }
        if (entry.tooltip) {
            attrs.title = entry.tooltip;
        }
        attrs.style = {
            color: entry.color || this.color
        };
        if (entry.className) {
            attrs.className += ' ' + entry.className;
        }
        return attrs;
    }
    renderElement(id, entry) {
        const childStrings = this.entryService.parse(entry.text);
        const children = [];
        childStrings.forEach((val, key) => {
            if (!(typeof val === 'string') && LabelIcon.is(val)) {
                if (val.name.startsWith('codicon-')) {
                    children.push(React.createElement("span", { key: key, className: `codicon ${val.name}${val.animation ? ' fa-' + val.animation : ''}` }));
                }
                else {
                    children.push(React.createElement("span", { key: key, className: `fa fa-${val.name}${val.animation ? ' fa-' + val.animation : ''}` }));
                }
            }
            else {
                children.push(React.createElement("span", { key: key }, val));
            }
        });
        const elementInnerDiv = React.createElement(React.Fragment, null, children);
        return React.createElement('div', { key: id, ...this.createAttributes(entry) }, elementInnerDiv);
    }
};
StatusBarImpl = __decorate([
    injectable(),
    __param(0, inject(CommandService)),
    __param(1, inject(LabelParser)),
    __param(2, inject(FrontendApplicationStateService))
], StatusBarImpl);
export { StatusBarImpl };

//# sourceMappingURL=../../../lib/browser/status-bar/status-bar.js.map
