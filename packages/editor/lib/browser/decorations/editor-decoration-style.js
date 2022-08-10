export class EditorDecorationStyle {
    constructor(selector, styleProvider) {
        this.selector = selector;
        EditorDecorationStyle.createRule(selector, styleProvider);
    }
    get className() {
        return this.selector.split('::')[0];
    }
    dispose() {
        EditorDecorationStyle.deleteRule(this.selector);
    }
}
(function (EditorDecorationStyle) {
    function copyStyle(from, to) {
        Object.keys(from).forEach(key => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            to[key] = from[key];
        });
    }
    EditorDecorationStyle.copyStyle = copyStyle;
    function createStyleSheet(container = document.getElementsByTagName('head')[0]) {
        if (!container) {
            return undefined;
        }
        const style = document.createElement('style');
        style.id = 'editorDecorationsStyle';
        style.type = 'text/css';
        style.media = 'screen';
        style.appendChild(document.createTextNode('')); // trick for webkit
        container.appendChild(style);
        return style.sheet;
    }
    EditorDecorationStyle.createStyleSheet = createStyleSheet;
    const editorDecorationsStyleSheet = createStyleSheet();
    function createRule(selector, styleProvider, styleSheet = editorDecorationsStyleSheet) {
        if (!styleSheet) {
            return;
        }
        const index = styleSheet.insertRule('.' + selector + '{}', 0);
        const rules = styleSheet.cssRules || styleSheet.rules;
        const rule = rules[index];
        if (rule && rule.type === CSSRule.STYLE_RULE) {
            const styleRule = rule;
            styleProvider(styleRule.style);
        }
    }
    EditorDecorationStyle.createRule = createRule;
    function deleteRule(selector, styleSheet = editorDecorationsStyleSheet) {
        if (!styleSheet) {
            return;
        }
        const rules = styleSheet.cssRules || styleSheet.rules;
        for (let i = 0; i < rules.length; i++) {
            if (rules[i].type === CSSRule.STYLE_RULE) {
                if (rules[i].selectorText === selector) {
                    styleSheet.removeRule(i);
                }
            }
        }
    }
    EditorDecorationStyle.deleteRule = deleteRule;
})(EditorDecorationStyle || (EditorDecorationStyle = {}));

//# sourceMappingURL=../../../lib/browser/decorations/editor-decoration-style.js.map
