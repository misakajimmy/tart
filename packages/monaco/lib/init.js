export class MonacoInit {
    static async init() {
        const core = new MonacoInit();
        return core.initContainer();
    }
    async initContainer() {
        let modules = [];
        const monacoBrowser = await import('./browser/monaco-browser-module');
        modules.push(monacoBrowser);
        return modules;
    }
}
export default MonacoInit;

//# sourceMappingURL=../lib/init.js.map
