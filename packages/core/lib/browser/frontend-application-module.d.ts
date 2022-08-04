import '../assets/style/index.css';
import 'font-awesome/css/font-awesome.min.css';
import 'file-icons-js/css/style.css';
import '@vscode/codicons/dist/codicon.css';
import { ContainerModule } from 'inversify';
import { bindResourceProvider } from './frontend-application-bindings';
import '../assets/style/materialcolors.css';
export { bindResourceProvider };
export declare const FrontendApplicationModule: ContainerModule;
export default FrontendApplicationModule;
