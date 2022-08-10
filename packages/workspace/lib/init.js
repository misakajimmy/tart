export class WorkspaceInit {
    static async init() {
        const core = new WorkspaceInit();
        return core.initContainer();
    }
    async initContainer() {
        let modules = [];
        const workspaceFrontend = await import('./browser/workspace-frontend-module');
        modules.push(workspaceFrontend);
        return modules;
    }
}
export default WorkspaceInit;

//# sourceMappingURL=../lib/init.js.map
