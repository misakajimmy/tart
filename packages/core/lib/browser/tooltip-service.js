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
import ReactTooltip from 'react-tooltip';
import { inject, injectable, optional, postConstruct } from 'inversify';
import { ReactRenderer, RendererHost } from './widgets';
import { CorePreferences } from './core-preferences';
import { DisposableCollection } from '../common';
import { v4 } from 'uuid';
export const TooltipService = Symbol('TooltipService');
const DELAY_PREFERENCE = 'workbench.hover.delay';
let TooltipServiceImpl = class TooltipServiceImpl extends ReactRenderer {
    tooltipId;
    corePreferences;
    rendered = false;
    toDispose = new DisposableCollection();
    constructor(host) {
        super(host);
        this.tooltipId = v4();
    }
    attachTo(host) {
        host.appendChild(this.host);
    }
    update(fullRender = false) {
        if (fullRender || !this.rendered) {
            this.render();
            this.rendered = true;
        }
        ReactTooltip.rebuild();
    }
    dispose() {
        this.toDispose.dispose();
        super.dispose();
    }
    init() {
        this.toDispose.push(this.corePreferences.onPreferenceChanged(preference => {
            if (preference.preferenceName === DELAY_PREFERENCE) {
                this.update(true);
            }
        }));
    }
    doRender() {
        const hoverDelay = this.corePreferences.get(DELAY_PREFERENCE);
        return React.createElement(ReactTooltip, { id: this.tooltipId, className: 'tart-tooltip', html: true, delayShow: hoverDelay });
    }
};
__decorate([
    inject(CorePreferences)
], TooltipServiceImpl.prototype, "corePreferences", void 0);
__decorate([
    postConstruct()
], TooltipServiceImpl.prototype, "init", null);
TooltipServiceImpl = __decorate([
    injectable(),
    __param(0, inject(RendererHost)),
    __param(0, optional())
], TooltipServiceImpl);
export { TooltipServiceImpl };

//# sourceMappingURL=../../lib/browser/tooltip-service.js.map
