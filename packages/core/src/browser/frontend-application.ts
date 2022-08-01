import {inject, injectable} from 'inversify';
import {ContributionProvider, MaybePromise} from '../common';
import {FrontendApplicationStateService} from './frontend-application-state';

export interface FrontendApplicationContribution {
  /**
   * Called on application startup before configure is called.
   */
  initialize?(): void;

  /**
   * Called before commands, key bindings and menus are initialized.
   * Should return a promise if it runs asynchronously.
   */
  configure?(app: FrontendApplication): MaybePromise<void>;

  /**
   * Called when the application is started. The application shell is not attached yet when this method runs.
   * Should return a promise if it runs asynchronously.
   */
  onStart?(app: FrontendApplication): MaybePromise<void>;
}

const TIMER_WARNING_THRESHOLD = 100;

export interface IFrontendApplicationStartProps {
  host: HTMLElement;
}

@injectable()
export class FrontendApplication {

  constructor(
      protected readonly contributions: ContributionProvider<FrontendApplicationContribution>,
      @inject(FrontendApplicationStateService) protected readonly stateService: FrontendApplicationStateService,
  ) {
  }

  async start(props: IFrontendApplicationStartProps): Promise<void> {
    await this.startContributions();
    this.stateService.state = 'started_contributions';
  }

  /**
   * Initialize and start the frontend application contributions.
   */
  protected async startContributions(): Promise<void> {
    for (const contribution of this.contributions.getContributions()) {
      if (contribution.initialize) {
        try {
          await this.measure(contribution.constructor.name + '.initialize',
              () => contribution.initialize!()
          );
        } catch (error) {
          console.error('Could not initialize contribution', error);
        }
      }
    }

    for (const contribution of this.contributions.getContributions()) {
      if (contribution.configure) {
        try {
          await this.measure(contribution.constructor.name + '.configure',
              () => contribution.configure!(this)
          );
        } catch (error) {
          console.error('Could not configure contribution', error);
        }
      }
    }

    for (const contribution of this.contributions.getContributions()) {
      if (contribution.onStart) {
        try {
          await this.measure(contribution.constructor.name + '.onStart',
              () => contribution.onStart!(this)
          );
        } catch (error) {
          console.error('Could not start contribution', error);
        }
      }
    }
  }

  protected async measure<T>(name: string, fn: () => MaybePromise<T>): Promise<T> {
    const startMark = name + '-start';
    const endMark = name + '-end';
    performance.mark(startMark);
    const result = await fn();
    performance.mark(endMark);
    performance.measure(name, startMark, endMark);
    for (const item of performance.getEntriesByName(name)) {
      const contribution = `Frontend ${item.name}`;
      if (item.duration > TIMER_WARNING_THRESHOLD) {
        console.warn(`${contribution} is slow, took: ${item.duration.toFixed(1)} ms`);
      } else {
        console.debug(`${contribution} took: ${item.duration.toFixed(1)} ms`);
      }
    }
    performance.clearMeasures(name);
    return result;
  }
}
