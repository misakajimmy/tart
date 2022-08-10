import {ContainerModule} from 'inversify';
import {EditorContribution} from './editor-contribution';
import {FrontendApplicationContribution, KeybindingContribution, WidgetFactory} from '@tartjs/core';
import {CommandContribution} from '@tartjs/core/lib/common';
import {EditorManager} from './editor-manager';
import {OpenHandler} from '@tartjs/core/lib/browser/opener-service';
import {bindEditorPreferences} from './editor-preference';
import {EditorWidgetFactory} from './editor-widget-factory';

export const EditorFrontendModule = new ContainerModule((bind) => {
  bindEditorPreferences(bind);

  bind(EditorWidgetFactory).toSelf().inSingletonScope();
  bind(WidgetFactory).toService(EditorWidgetFactory);

  bind(EditorContribution).toSelf().inSingletonScope();
  bind(FrontendApplicationContribution).toService(EditorContribution);

  bind(EditorManager).toSelf().inSingletonScope();
  bind(OpenHandler).toService(EditorManager);

  [KeybindingContribution, CommandContribution].forEach(serviceIdentifier => {
    bind(serviceIdentifier).toService(EditorContribution);
  });
});

export default EditorFrontendModule;
