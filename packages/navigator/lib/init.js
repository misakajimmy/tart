export class NavigatorInit {
    static async init() {
        const core = new NavigatorInit();
        return core.initContainer();
    }
    async initContainer() {
        let modules = [];
        const monacoBrowser = await import('./browser/navigator-frontend-module');
        modules.push(monacoBrowser);
        return modules;
    }
}
export default NavigatorInit;

//# sourceMappingURL=../lib/init.js.map
