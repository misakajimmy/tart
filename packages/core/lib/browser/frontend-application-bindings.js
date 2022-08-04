import { bindPreferenceSchemaProvider, PreferenceSchemaProvider } from './preferences/preference-contribution';
import { PreferenceProvider } from './preferences/preference-provider';
import { PreferenceScope } from './preferences/preference-scope';
import { bindContributionProvider, DefaultResourceProvider, MessageClient, MessageService, MessageServiceFactory, ResourceProvider, ResourceResolver } from '../common';
import { PreferenceProviderProvider, PreferenceService, PreferenceServiceImpl } from './preferences/preference-service';
export function bindMessageService(bind) {
    bind(MessageClient).toSelf().inSingletonScope();
    bind(MessageServiceFactory).toFactory(({ container }) => () => container.get(MessageService));
    return bind(MessageService).toSelf().inSingletonScope();
}
export function bindPreferenceService(bind) {
    // bind(PreferenceProvider).toSelf().inSingletonScope().whenTargetNamed(PreferenceScope.User);
    // bind(PreferenceProvider).toSelf().inSingletonScope().whenTargetNamed(PreferenceScope.Workspace);
    // bind(PreferenceProvider).toSelf().inSingletonScope().whenTargetNamed(PreferenceScope.Folder);
    bind(PreferenceProviderProvider).toFactory(ctx => (scope) => {
        if (scope === PreferenceScope.Default) {
            return ctx.container.get(PreferenceSchemaProvider);
        }
        return ctx.container.getNamed(PreferenceProvider, scope);
    });
    bind(PreferenceServiceImpl).toSelf().inSingletonScope();
    bind(PreferenceService).toService(PreferenceServiceImpl);
    bindPreferenceSchemaProvider(bind);
}
export function bindResourceProvider(bind) {
    bind(DefaultResourceProvider).toSelf().inSingletonScope();
    bind(ResourceProvider).toProvider(context => uri => context.container.get(DefaultResourceProvider).get(uri));
    bindContributionProvider(bind, ResourceResolver);
}

//# sourceMappingURL=../../lib/browser/frontend-application-bindings.js.map
