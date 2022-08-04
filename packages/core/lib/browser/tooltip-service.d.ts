import * as React from 'react';
import { ReactRenderer, RendererHost } from './widgets';
import { CorePreferences } from './core-preferences';
import { DisposableCollection } from '../common';
export declare const TooltipService: unique symbol;
export interface TooltipService {
    tooltipId: string;
    attachTo(host: HTMLElement): void;
    update(fullRender?: boolean): void;
}
/**
 * Attributes to be added to an HTML element to enable
 * rich HTML tooltip rendering
 */
export interface TooltipAttributes {
    /**
     * HTML to render in the tooltip.
     */
    'data-tip': string;
    /**
     * The ID of the tooltip renderer. Should be TOOLTIP_ID.
     */
    'data-for': string;
}
export declare class TooltipServiceImpl extends ReactRenderer implements TooltipService {
    readonly tooltipId: string;
    protected readonly corePreferences: CorePreferences;
    protected rendered: boolean;
    protected toDispose: DisposableCollection;
    constructor(host?: RendererHost);
    attachTo(host: HTMLElement): void;
    update(fullRender?: boolean): void;
    dispose(): void;
    protected init(): void;
    protected doRender(): React.ReactNode;
}
