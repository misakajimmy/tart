import '../assets/style/index.css';
import 'font-awesome/css/font-awesome.min.css';
import 'file-icons-js/css/style.css';
import '@vscode/codicons/dist/codicon.css';

import {ContainerModule} from 'inversify';
import {FrontendApplication, FrontendApplicationContribution} from './frontend-application';
import {
  ApplicationShell,
  ApplicationShellMouseTracker,
  ApplicationShellOptions,
  SidePanelHandler,
  SidePanelHandlerFactory,
  TabBarRenderer,
  TabBarRendererFactory
} from './shell';
import {StatusBar, StatusBarImpl} from './status-bar';
import {CommandContribution, CommandRegistry, CommandService} from '../common/command';
import {
  bindContributionProvider,
  InMemoryResources,
  InMemoryTextResourceResolver,
  MenuContribution,
  MenuModelRegistry,
  MessageClient,
  MessageService,
  ResourceResolver,
  SelectionService
} from '../common';
import {LabelParser} from './label-parser';
import {FrontendApplicationStateService} from './frontend-application-state';
import {
  TabBarToolbar,
  TabBarToolbarContribution,
  TabBarToolbarFactory,
  TabBarToolbarRegistry
} from './shell/tab-bar-toolbar';
import {ContextKeyService} from './context-key-service';
import {
  SidebarBottomMenuWidgetFactory,
  SidebarMenuWidget,
  SidebarTopMenuWidgetFactory
} from './shell/sidebar-menu-widget';
// import {TabBarRenderer, TabBarRendererFactory} from './shell/tab-bars';
import {ContextMenuRenderer} from './context-menu-renderer';
import {TabBarDecorator, TabBarDecoratorService} from './shell/tab-bar-decorator';
import {IconThemeService, NoneIconTheme} from './icon-theme-service';
import {SidebarBottomMenuWidget} from './shell/sidebar-bottom-menu-widget';
import {SplitPositionHandler} from './shell/split-panels';
import {ContextMenuContext} from './menu';
import {KeybindingContext, KeybindingContribution, KeybindingRegistry} from './keybinding';
import {KeyboardLayoutService} from './keyboard';
import {LocalStorageService, StorageService} from './storage-service';
import {DefaultUriLabelProviderContribution, LabelProvider, LabelProviderContribution} from './label-provider';
import {WidgetFactory, WidgetManager} from './widget-manager';
import {LanguageService} from './language-service';
import {ApplicationShellLayoutMigration, ShellLayoutRestorer} from './shell/shell-layout-restorer';
import {AboutDialog, AboutDialogProps} from './about-dialog';
import {CommonFrontendContribution} from './common-frontend-contribution';
import {ViewContainer, ViewContainerIdentifier} from './view-container';
import {ColorRegistry} from './color-registry';
import {ColorApplicationContribution, ColorContribution} from './color-application-contribution';
import {ThemeService} from './theming';
import {
  DefaultQuickAccessRegistry,
  QuickAccessContribution,
  QuickCommandFrontendContribution,
  QuickCommandService,
  QuickViewService
} from './quick-input';
import {DefaultOpenerService, OpenerService, OpenHandler} from './opener-service';
import {bindPreferenceService, bindResourceProvider} from './frontend-application-bindings';
import {PreferenceService} from './preferences/preference-service';
import {bindCorePreferences} from './core-preferences';
import {QuickInputFrontendContribution} from './quick-input/quick-input-frontend-contribution';
import {EncodingService} from '../common/encoding-service';
import {EncodingRegistry} from './encoding-registry';
import {ProgressBarFactory, ProgressBarOptions} from './progress-bar-factory';
import {ProgressBar} from './progress-bar';
import {TreeLabelProvider} from './tree/tree-label-provider';
import {DiffUriLabelProviderContribution} from './diff-uris';
import {DialogOverlayService} from './dialogs';
import {LocalizationContribution, LocalizationRegistry} from '../common/i18n/localization-contribution';
import {LocalizationProvider} from '../common/i18n/localization-provider';
import {HttpOpenHandler} from './http-open-handler';
import {ExternalUriService} from './external-uri-service';

import '../assets/style/materialcolors.css';

// FrontendApplicationConfigProvider.set();

export {bindResourceProvider};

ColorApplicationContribution.initBackground();

export const FrontendApplicationModule = new ContainerModule((bind, unbind, isBound, rebind) => {
  bind(NoneIconTheme).toSelf().inSingletonScope();
  bind(LabelProviderContribution).toService(NoneIconTheme);
  bind(IconThemeService).toSelf().inSingletonScope();

  // bind(QuickAccessRegistry).toService(DefaultQuickAccessRegistry);

  bind(ColorRegistry).toSelf().inSingletonScope();
  bindContributionProvider(bind, ColorContribution);
  bind(ColorApplicationContribution).toSelf().inSingletonScope();
  bind(FrontendApplicationContribution).toService(ColorApplicationContribution);

  bindContributionProvider(bind, LabelProviderContribution);
  bind(LabelProvider).toSelf().inSingletonScope();
  bind(FrontendApplicationContribution).toService(LabelProvider);

  bind(DefaultUriLabelProviderContribution).toSelf().inSingletonScope();
  bind(LabelProviderContribution).toService(DefaultUriLabelProviderContribution);
  bind(LabelProviderContribution).to(DiffUriLabelProviderContribution).inSingletonScope();

  bind(TreeLabelProvider).toSelf().inSingletonScope();
  bind(LabelProviderContribution).toService(TreeLabelProvider);

  bind(ApplicationShell).toSelf().inSingletonScope();
  bind(SidePanelHandlerFactory).toAutoFactory(SidePanelHandler);
  bind(SidePanelHandler).toSelf();

  bind(AboutDialog).toSelf().inSingletonScope();
  bind(AboutDialogProps).toConstantValue({title: 'Tart'});

  bindContributionProvider(bind, ApplicationShellLayoutMigration);

  bind(ContextKeyService).toSelf().inSingletonScope();

  bind(MenuModelRegistry).toSelf().inSingletonScope();
  bindContributionProvider(bind, MenuContribution);

  bindContributionProvider(bind, OpenHandler);

  bind(ExternalUriService).toSelf().inSingletonScope();
  bind(HttpOpenHandler).toSelf().inSingletonScope();
  bind(OpenHandler).toService(HttpOpenHandler);

  bindContributionProvider(bind, WidgetFactory);
  bind(WidgetManager).toSelf().inSingletonScope();

  bind(ShellLayoutRestorer).toSelf().inSingletonScope();
  bind(CommandContribution).toService(ShellLayoutRestorer);

  bindResourceProvider(bind);
  bind(InMemoryResources).toSelf().inSingletonScope();
  bind(ResourceResolver).toService(InMemoryResources);

  bind(EncodingService).toSelf().inSingletonScope();
  bind(EncodingRegistry).toSelf().inSingletonScope();

  bind(InMemoryTextResourceResolver).toSelf().inSingletonScope();
  bind(ResourceResolver).toService(InMemoryTextResourceResolver);

  bind(KeyboardLayoutService).toSelf().inSingletonScope();
  bind(KeybindingRegistry).toSelf().inSingletonScope();
  bindContributionProvider(bind, KeybindingContext);
  bindContributionProvider(bind, KeybindingContribution);

  bindContributionProvider(bind, TabBarDecorator);

  bind(LanguageService).toSelf().inSingletonScope();

  bind(TabBarDecoratorService).toSelf().inSingletonScope();
  bind(FrontendApplicationContribution).toService(TabBarDecoratorService);

  bind(FrontendApplication).toSelf().inSingletonScope();
  bind(ApplicationShellOptions).toConstantValue({});

  bind(FrontendApplicationStateService).toSelf().inSingletonScope();

  bind(TabBarToolbarRegistry).toSelf().inSingletonScope();
  bind(FrontendApplicationContribution).toService(TabBarToolbarRegistry);

  bind(SidebarTopMenuWidgetFactory).toAutoFactory(SidebarMenuWidget);
  bind(SidebarMenuWidget).toSelf();

  bind(TabBarToolbarFactory).toFactory(context => () => {
    const container = context.container.createChild();
    container.bind(TabBarToolbar).toSelf().inSingletonScope();
    return container.get(TabBarToolbar);
  });

  bind(SidebarBottomMenuWidget).toSelf();
  bind(SidebarBottomMenuWidgetFactory).toAutoFactory(SidebarBottomMenuWidget);
  bind(SplitPositionHandler).toSelf().inSingletonScope();

  bind(ThemeService).toDynamicValue(() => ThemeService.get());

  bind(CommonFrontendContribution).toSelf().inSingletonScope();
  [FrontendApplicationContribution, CommandContribution, KeybindingContribution, MenuContribution, ColorContribution, LocalizationContribution].forEach(serviceIdentifier =>
      bind(serviceIdentifier).toService(CommonFrontendContribution)
  );

  bind(DefaultOpenerService).toSelf().inSingletonScope();
  bind(OpenerService).toService(DefaultOpenerService);

  bind(QuickCommandFrontendContribution).toSelf().inSingletonScope();
  [CommandContribution, KeybindingContribution, MenuContribution].forEach(serviceIdentifier =>
      bind(serviceIdentifier).toService(QuickCommandFrontendContribution)
  );

  bind(QuickCommandService).toSelf().inSingletonScope();
  bind(QuickAccessContribution).toService(QuickCommandService);

  // bind(EnvVariablesServer).toDynamicValue(ctx => {
  //     const connection = ctx.container.get(WebSocketConnectionProvider);
  //     return connection.createProxy<EnvVariablesServer>(envVariablesPath);
  // }).inSingletonScope();

  // bind(QuickPickService).to(QuickPickServiceImpl).inSingletonScope().onActivation(({ container }, quickPickService: QuickPickService) => {
  //     WebSocketConnectionProvider.createProxy(container, quickPickServicePath, quickPickService);
  //     return quickPickService;
  // });

  bindContributionProvider(bind, QuickAccessContribution);
  bind(QuickInputFrontendContribution).toSelf().inSingletonScope();
  bind(FrontendApplicationContribution).toService(QuickInputFrontendContribution);

  bind(TabBarRendererFactory).toFactory(context => () => {
    const contextMenuRenderer = context.container.get<ContextMenuRenderer>(ContextMenuRenderer);
    const decoratorService = context.container.get<TabBarDecoratorService>(TabBarDecoratorService);
    const iconThemeService = context.container.get<IconThemeService>(IconThemeService);
    return new TabBarRenderer(contextMenuRenderer, decoratorService, iconThemeService);
  });

  bind(ProgressBarFactory).toFactory(context => (options: ProgressBarOptions) => {
    const childContainer = context.container.createChild();
    childContainer.bind(ProgressBarOptions).toConstantValue(options);
    childContainer.bind(ProgressBar).toSelf().inSingletonScope();
    return childContainer.get(ProgressBar);
  });

  bind(LabelParser).toSelf().inSingletonScope();

  bind(ContextMenuContext).toSelf().inSingletonScope();

  bind(SelectionService).toSelf().inSingletonScope();
  bind(CommandRegistry).toSelf().inSingletonScope().onActivation(({container}, registry) => {
    return registry;
  });
  bind(CommandService).toService(CommandRegistry);
  bindContributionProvider(bind, CommandContribution);

  bind(LocalStorageService).toSelf().inSingletonScope();
  bind(StorageService).toService(LocalStorageService);

  bind(MessageClient).toSelf().inSingletonScope();
  bind(MessageService).toSelf().inSingletonScope();

  bind(ApplicationShellMouseTracker).toSelf().inSingletonScope();
  bind(FrontendApplicationContribution).toService(ApplicationShellMouseTracker);

  bind(ViewContainer.Factory).toFactory(context => (options: ViewContainerIdentifier) => {
    const container = context.container.createChild();
    container.bind(ViewContainerIdentifier).toConstantValue(options);
    container.bind(ViewContainer).toSelf().inSingletonScope();
    return container.get(ViewContainer);
  });

  bind(QuickViewService).toSelf().inSingletonScope();
  bind(QuickAccessContribution).toService(QuickViewService);

  bind(StatusBarImpl).toSelf().inSingletonScope();
  bind(StatusBar).toService(StatusBarImpl);

  bindContributionProvider(bind, TabBarToolbarContribution);
  bindContributionProvider(bind, FrontendApplicationContribution);

  bindContributionProvider(bind, LocalizationContribution);
  bind(LocalizationRegistry).toSelf().inSingletonScope();
  bind(FrontendApplicationContribution).toService(LocalizationRegistry);

  bindPreferenceService(bind);
  bind(FrontendApplicationContribution).toService(PreferenceService);

  bind(DialogOverlayService).toSelf().inSingletonScope();
  bind(FrontendApplicationContribution).toService(DialogOverlayService);

  bind(LocalizationProvider).toSelf().inSingletonScope();
  bindCorePreferences(bind);

  bind(DefaultQuickAccessRegistry).toSelf().inSingletonScope();

});

export default FrontendApplicationModule;
