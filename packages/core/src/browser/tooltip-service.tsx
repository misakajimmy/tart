import * as React from 'react';
import ReactTooltip from 'react-tooltip';
import {inject, injectable, optional, postConstruct} from 'inversify';
import {ReactRenderer, RendererHost} from './widgets';
import {CorePreferences} from './core-preferences';
import {DisposableCollection} from '../common';
import {v4} from 'uuid';

export const TooltipService = Symbol('TooltipService');

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

const DELAY_PREFERENCE = 'workbench.hover.delay';

@injectable()
export class TooltipServiceImpl extends ReactRenderer implements TooltipService {

  public readonly tooltipId: string;
  @inject(CorePreferences)
  protected readonly corePreferences: CorePreferences;
  protected rendered = false;
  protected toDispose: DisposableCollection = new DisposableCollection();

  constructor(
      @inject(RendererHost) @optional() host?: RendererHost
  ) {
    super(host);
    this.tooltipId = v4();
  }

  public attachTo(host: HTMLElement): void {
    host.appendChild(this.host);
  }

  public update(fullRender = false): void {
    if (fullRender || !this.rendered) {
      this.render();
      this.rendered = true;
    }

    ReactTooltip.rebuild();
  }

  public dispose(): void {
    this.toDispose.dispose();
    super.dispose();
  }

  @postConstruct()
  protected init(): void {
    this.toDispose.push(this.corePreferences.onPreferenceChanged(preference => {
      if (preference.preferenceName === DELAY_PREFERENCE) {
        this.update(true);
      }
    }));
  }

  protected doRender(): React.ReactNode {
    const hoverDelay = this.corePreferences.get(DELAY_PREFERENCE);
    return <ReactTooltip id={this.tooltipId} className='tart-tooltip' html={true} delayShow={hoverDelay}/>;
  }
}
