var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { inject, injectable } from 'inversify';
import * as React from 'react';
import { CommandRegistry } from '../../common';
import { ContextKeyService } from '../context-key-service';
import { WindowService } from '../window';
import { TreeWidget } from './tree-widget';
let TreeViewWelcomeWidget = class TreeViewWelcomeWidget extends TreeWidget {
    commands;
    contextService;
    windowService;
    viewWelcomeNodes = [];
    defaultItem;
    items = [];
    get visibleItems() {
        const visibleItems = this.items.filter(v => v.visible);
        if (visibleItems.length && this.defaultItem) {
            return [this.defaultItem.welcomeInfo];
        }
        return visibleItems.map(v => v.welcomeInfo);
    }
    handleViewWelcomeContentChange(viewWelcomes) {
        this.items = [];
        for (const welcomeInfo of viewWelcomes) {
            if (welcomeInfo.when === 'default') {
                this.defaultItem = { welcomeInfo, visible: true };
            }
            else {
                const visible = welcomeInfo.when === undefined || this.contextService.match(welcomeInfo.when);
                this.items.push({ welcomeInfo, visible });
            }
        }
        this.updateViewWelcomeNodes();
        this.update();
    }
    handleWelcomeContextChange() {
        let didChange = false;
        for (const item of this.items) {
            if (!item.welcomeInfo.when || item.welcomeInfo.when === 'default') {
                continue;
            }
            const visible = item.welcomeInfo.when === undefined || this.contextService.match(item.welcomeInfo.when);
            if (item.visible === visible) {
                continue;
            }
            item.visible = visible;
            didChange = true;
        }
        if (didChange) {
            this.updateViewWelcomeNodes();
            this.update();
        }
    }
    renderTree(model) {
        if (this.shouldShowWelcomeView() && this.visibleItems.length) {
            return this.renderViewWelcome();
        }
        return super.renderTree(model);
    }
    shouldShowWelcomeView() {
        return false;
    }
    renderViewWelcome() {
        return (React.createElement("div", { className: 'tart-WelcomeView' }, ...this.viewWelcomeNodes));
    }
    updateViewWelcomeNodes() {
        this.viewWelcomeNodes = [];
        const items = this.visibleItems.sort((a, b) => a.order - b.order);
        for (const [iIndex, { content }] of items.entries()) {
            const lines = content.split('\n');
            for (let [lIndex, line] of lines.entries()) {
                const lineKey = `${iIndex}-${lIndex}`;
                line = line.trim();
                if (!line) {
                    continue;
                }
                const linkedTextItems = this.parseLinkedText(line);
                if (linkedTextItems.length === 1 && typeof linkedTextItems[0] !== 'string') {
                    this.viewWelcomeNodes.push(this.renderButtonNode(linkedTextItems[0], lineKey));
                }
                else {
                    const linkedTextNodes = [];
                    for (const [nIndex, node] of linkedTextItems.entries()) {
                        const linkedTextKey = `${lineKey}-${nIndex}`;
                        if (typeof node === 'string') {
                            linkedTextNodes.push(this.renderTextNode(node, linkedTextKey));
                        }
                        else {
                            linkedTextNodes.push(this.renderCommandLinkNode(node, linkedTextKey));
                        }
                    }
                    this.viewWelcomeNodes.push(React.createElement("div", { key: `line-${lineKey}` }, ...linkedTextNodes));
                }
            }
        }
    }
    renderButtonNode(node, lineKey) {
        return (React.createElement("div", { key: `line-${lineKey}`, className: 'tart-WelcomeViewButtonWrapper' },
            React.createElement("button", { title: node.title, className: 'tart-button tart-WelcomeViewButton', disabled: !this.isEnabledClick(node.href), onClick: e => this.openLinkOrCommand(e, node.href) }, node.label)));
    }
    renderTextNode(node, textKey) {
        return React.createElement("span", { key: `text-${textKey}` }, node);
    }
    renderCommandLinkNode(node, linkKey) {
        return (React.createElement("a", { key: `link-${linkKey}`, className: this.getLinkClassName(node.href), title: node.title || '', onClick: e => this.openLinkOrCommand(e, node.href) }, node.label));
    }
    getLinkClassName(href) {
        const classNames = ['tart-WelcomeViewCommandLink'];
        if (!this.isEnabledClick(href)) {
            classNames.push('disabled');
        }
        return classNames.join(' ');
    }
    isEnabledClick(href) {
        if (href.startsWith('command:')) {
            const command = href.replace('command:', '');
            return this.commands.isEnabled(command);
        }
        return true;
    }
    openLinkOrCommand = (event, href) => {
        event.stopPropagation();
        if (href.startsWith('command:')) {
            const command = href.replace('command:', '');
            this.commands.executeCommand(command);
        }
        else {
            this.windowService.openNewWindow(href, { external: true });
        }
    };
    parseLinkedText(text) {
        const result = [];
        const linkRegex = /\[([^\]]+)\]\(((?:https?:\/\/|command:)[^\)\s]+)(?: ("|')([^\3]+)(\3))?\)/gi;
        let index = 0;
        let match;
        while (match = linkRegex.exec(text)) {
            if (match.index - index > 0) {
                result.push(text.substring(index, match.index));
            }
            const [, label, href, , title] = match;
            if (title) {
                result.push({ label, href, title });
            }
            else {
                result.push({ label, href });
            }
            index = match.index + match[0].length;
        }
        if (index < text.length) {
            result.push(text.substring(index));
        }
        return result;
    }
};
__decorate([
    inject(CommandRegistry)
], TreeViewWelcomeWidget.prototype, "commands", void 0);
__decorate([
    inject(ContextKeyService)
], TreeViewWelcomeWidget.prototype, "contextService", void 0);
__decorate([
    inject(WindowService)
], TreeViewWelcomeWidget.prototype, "windowService", void 0);
TreeViewWelcomeWidget = __decorate([
    injectable()
], TreeViewWelcomeWidget);
export { TreeViewWelcomeWidget };

//# sourceMappingURL=../../../lib/browser/tree/tree-view-welcome-widget.js.map
