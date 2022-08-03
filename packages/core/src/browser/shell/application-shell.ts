import {injectable} from 'inversify';
import {Widget} from '@lumino/widgets';

/** The class name added to ApplicationShell instances. */
const APPLICATION_SHELL_CLASS = 'tart-ApplicationShell';

@injectable()
export class ApplicationShell extends Widget {
  constructor() {
    super();
    this.addClass(APPLICATION_SHELL_CLASS);
    this.id = 'tart-app-shell';
  }
}
