import { ContainerModule } from 'inversify';
import { clearMonacoQuickAccessProviders, loadMonaco, loadVsRequire } from './monaco-loader';
export { ContainerModule };
export const MonacoBrowserModule = loadVsRequire(window)
    .then(vsRequire => loadMonaco(vsRequire))
    .then(() => clearMonacoQuickAccessProviders())
    .then(() => import('./monaco-frontend-module'))
    .then(module => module.MonacoFrontendModule);
export default MonacoBrowserModule;

//# sourceMappingURL=../../lib/browser/monaco-browser-module.js.map
