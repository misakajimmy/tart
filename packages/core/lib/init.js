export class CoreInit {
    static async init() {
        const core = new CoreInit();
        return core.initContainer();
    }
    async initContainer() {
        let modules = [];
        const frontendApplication = await import('./browser/frontend-application-module.js');
        modules.push(frontendApplication);
        const browserMenu = await import('./browser/menu/browser-menu-module.js');
        modules.push(browserMenu);
        const browserWindow = await import('./browser/window/browser-window-module.js');
        modules.push(browserWindow);
        const browserKeyboard = await import('./browser/keyboard/browser-keyboard-module');
        modules.push(browserKeyboard);
        return modules;
    }
}
export default CoreInit;

//# sourceMappingURL=../lib/init.js.map
