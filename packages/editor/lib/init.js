export class EditorInit {
    static async init() {
        const core = new EditorInit();
        return core.initContainer();
    }
    async initContainer() {
        let modules = [];
        const editorFrontend = await import('./browser/editor-frontend-module');
        modules.push(editorFrontend);
        return modules;
    }
}
export default EditorInit;

//# sourceMappingURL=../lib/init.js.map
