var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { inject, injectable, postConstruct } from 'inversify';
import { AbstractDialog, codiconArray, createIconButton, DialogProps, Key, Panel, setEnabled } from '@tart/core';
import { FileDialogTreeFiltersRendererFactory } from './file-dialog-tree-filters-renderer';
import { Disposable } from '@tart/core/lib/common';
import { LocationListRenderer, LocationListRendererFactory } from '../location';
import { FileDialogWidget } from './file-dialog-widget';
import { LabelProvider, Widget } from '@tart/core/lib/browser';
export const OpenFileDialogFactory = Symbol('OpenFileDialogFactory');
export const SaveFileDialogFactory = Symbol('SaveFileDialogFactory');
export const SAVE_DIALOG_CLASS = 'tart-SaveFileDialog';
export const NAVIGATION_PANEL_CLASS = 'tart-NavigationPanel';
export const NAVIGATION_BACK_CLASS = 'tart-NavigationBack';
export const NAVIGATION_FORWARD_CLASS = 'tart-NavigationForward';
export const NAVIGATION_HOME_CLASS = 'tart-NavigationHome';
export const NAVIGATION_UP_CLASS = 'tart-NavigationUp';
export const NAVIGATION_LOCATION_LIST_PANEL_CLASS = 'tart-LocationListPanel';
export const FILTERS_PANEL_CLASS = 'tart-FiltersPanel';
export const FILTERS_LABEL_CLASS = 'tart-FiltersLabel';
export const FILTERS_LIST_PANEL_CLASS = 'tart-FiltersListPanel';
export const FILENAME_PANEL_CLASS = 'tart-FileNamePanel';
export const FILENAME_LABEL_CLASS = 'tart-FileNameLabel';
export const FILENAME_TEXTFIELD_CLASS = 'tart-FileNameTextField';
export const CONTROL_PANEL_CLASS = 'tart-ControlPanel';
export const TOOLBAR_ITEM_TRANSFORM_TIMEOUT = 100;
export class FileDialogProps extends DialogProps {
}
let OpenFileDialogProps = class OpenFileDialogProps extends FileDialogProps {
};
OpenFileDialogProps = __decorate([
    injectable()
], OpenFileDialogProps);
export { OpenFileDialogProps };
let SaveFileDialogProps = class SaveFileDialogProps extends FileDialogProps {
};
SaveFileDialogProps = __decorate([
    injectable()
], SaveFileDialogProps);
export { SaveFileDialogProps };
let FileDialog = class FileDialog extends AbstractDialog {
    constructor(props) {
        super(props);
        this.props = props;
    }
    get model() {
        return this.widget.model;
    }
    init() {
        this.treePanel = new Panel();
        this.treePanel.addWidget(this.widget);
        this.toDispose.push(this.treePanel);
        this.toDispose.push(this.model.onChanged(() => this.update()));
        this.toDispose.push(this.model.onDidOpenFile(() => this.accept()));
        this.toDispose.push(this.model.onSelectionChanged(() => this.update()));
        const navigationPanel = document.createElement('div');
        navigationPanel.classList.add(NAVIGATION_PANEL_CLASS);
        this.contentNode.appendChild(navigationPanel);
        navigationPanel.appendChild(this.back = createIconButton(...codiconArray('chevron-left', true)));
        this.back.classList.add(NAVIGATION_BACK_CLASS);
        this.back.title = 'Navigate Back';
        navigationPanel.appendChild(this.forward = createIconButton(...codiconArray('chevron-right', true)));
        this.forward.classList.add(NAVIGATION_FORWARD_CLASS);
        this.forward.title = 'Navigate Forward';
        navigationPanel.appendChild(this.home = createIconButton(...codiconArray('home', true)));
        this.home.classList.add(NAVIGATION_HOME_CLASS);
        this.home.title = 'Go To Initial Location';
        navigationPanel.appendChild(this.up = createIconButton(...codiconArray('arrow-up', true)));
        this.up.classList.add(NAVIGATION_UP_CLASS);
        this.up.title = 'Navigate Up One Directory';
        const locationListRendererHost = document.createElement('div');
        this.locationListRenderer = this.locationListFactory({ model: this.model, host: locationListRendererHost });
        this.toDispose.push(this.locationListRenderer);
        this.locationListRenderer.host.classList.add(NAVIGATION_LOCATION_LIST_PANEL_CLASS);
        navigationPanel.appendChild(this.locationListRenderer.host);
        if (this.props.filters) {
            this.treeFiltersRenderer = this.treeFiltersFactory({
                suppliedFilters: this.props.filters,
                fileDialogTree: this.widget.model.tree
            });
            const filters = Object.keys(this.props.filters);
            if (filters.length) {
                this.widget.model.tree.setFilter(this.props.filters[filters[0]]);
            }
        }
    }
    onUpdateRequest(msg) {
        super.onUpdateRequest(msg);
        setEnabled(this.back, this.model.canNavigateBackward());
        setEnabled(this.forward, this.model.canNavigateForward());
        setEnabled(this.home, !!this.model.initialLocation
            && !!this.model.location
            && this.model.initialLocation.toString() !== this.model.location.toString());
        setEnabled(this.up, this.model.canNavigateUpward());
        console.log(this.locationListRenderer);
        this.locationListRenderer.render();
        if (this.treeFiltersRenderer) {
            this.treeFiltersRenderer.render();
        }
        this.widget.update();
    }
    handleEnter(event) {
        if (event.target instanceof HTMLTextAreaElement || this.targetIsDirectoryInput(event.target) || this.targetIsInputToggle(event.target)) {
            return false;
        }
        this.accept();
    }
    handleEscape(event) {
        if (event.target instanceof HTMLTextAreaElement || this.targetIsDirectoryInput(event.target)) {
            return false;
        }
        this.close();
    }
    targetIsDirectoryInput(target) {
        return target instanceof HTMLInputElement && target.classList.contains(LocationListRenderer.Styles.LOCATION_TEXT_INPUT_CLASS);
    }
    targetIsInputToggle(target) {
        return target instanceof HTMLSpanElement && target.classList.contains(LocationListRenderer.Styles.LOCATION_INPUT_TOGGLE_CLASS);
    }
    appendFiltersPanel() {
        if (this.treeFiltersRenderer) {
            const filtersPanel = document.createElement('div');
            filtersPanel.classList.add(FILTERS_PANEL_CLASS);
            this.contentNode.appendChild(filtersPanel);
            const titlePanel = document.createElement('div');
            titlePanel.innerHTML = 'Format:';
            titlePanel.classList.add(FILTERS_LABEL_CLASS);
            filtersPanel.appendChild(titlePanel);
            this.treeFiltersRenderer.host.classList.add(FILTERS_LIST_PANEL_CLASS);
            filtersPanel.appendChild(this.treeFiltersRenderer.host);
        }
    }
    onAfterAttach(msg) {
        Widget.attach(this.treePanel, this.contentNode);
        this.toDisposeOnDetach.push(Disposable.create(() => {
            Widget.detach(this.treePanel);
            this.locationListRenderer.dispose();
            if (this.treeFiltersRenderer) {
                this.treeFiltersRenderer.dispose();
            }
        }));
        this.appendFiltersPanel();
        this.appendCloseButton('Cancel');
        this.appendAcceptButton(this.getAcceptButtonLabel());
        this.addKeyListener(this.back, Key.ENTER, () => {
            this.addTransformEffectToIcon(this.back);
            this.model.navigateBackward();
        }, 'click');
        this.addKeyListener(this.forward, Key.ENTER, () => {
            this.addTransformEffectToIcon(this.forward);
            this.model.navigateForward();
        }, 'click');
        this.addKeyListener(this.home, Key.ENTER, () => {
            this.addTransformEffectToIcon(this.home);
            if (this.model.initialLocation) {
                this.model.location = this.model.initialLocation;
            }
        }, 'click');
        this.addKeyListener(this.up, Key.ENTER, () => {
            this.addTransformEffectToIcon(this.up);
            if (this.model.location) {
                this.model.location = this.model.location.parent;
            }
        }, 'click');
        super.onAfterAttach(msg);
    }
    addTransformEffectToIcon(element) {
        const icon = element.getElementsByTagName('i')[0];
        icon.classList.add('active');
        setTimeout(() => icon.classList.remove('active'), TOOLBAR_ITEM_TRANSFORM_TIMEOUT);
    }
    onActivateRequest(msg) {
        this.widget.activate();
    }
};
__decorate([
    inject(FileDialogWidget)
], FileDialog.prototype, "widget", void 0);
__decorate([
    inject(LocationListRendererFactory)
], FileDialog.prototype, "locationListFactory", void 0);
__decorate([
    inject(FileDialogTreeFiltersRendererFactory)
], FileDialog.prototype, "treeFiltersFactory", void 0);
__decorate([
    postConstruct()
], FileDialog.prototype, "init", null);
FileDialog = __decorate([
    __param(0, inject(FileDialogProps))
], FileDialog);
export { FileDialog };
let OpenFileDialog = class OpenFileDialog extends FileDialog {
    constructor(props) {
        super(props);
        this.props = props;
    }
    get value() {
        if (this.widget.model.selectedFileStatNodes.length === 1) {
            return this.widget.model.selectedFileStatNodes[0];
        }
        else {
            return this.widget.model.selectedFileStatNodes;
        }
    }
    init() {
        console.log('init');
        super.init();
        console.log('init over');
        const { props } = this;
        if (props.canSelectFiles !== undefined) {
            this.widget.disableFileSelection = !props.canSelectFiles;
        }
    }
    getAcceptButtonLabel() {
        return this.props.openLabel ? this.props.openLabel : 'Open';
    }
    isValid(value) {
        if (value && !this.props.canSelectMany && value instanceof Array) {
            return 'You can select only one item';
        }
        return '';
    }
    async accept() {
        const selection = this.value;
        if (!this.props.canSelectFolders
            && !Array.isArray(selection)
            && selection.fileStat.isDirectory) {
            this.widget.model.openNode(selection);
            return;
        }
        super.accept();
    }
};
__decorate([
    postConstruct()
], OpenFileDialog.prototype, "init", null);
OpenFileDialog = __decorate([
    injectable(),
    __param(0, inject(OpenFileDialogProps))
], OpenFileDialog);
export { OpenFileDialog };
let SaveFileDialog = class SaveFileDialog extends FileDialog {
    constructor(props) {
        super(props);
        this.props = props;
    }
    get value() {
        if (this.fileNameField && this.widget.model.selectedFileStatNodes.length === 1) {
            const node = this.widget.model.selectedFileStatNodes[0];
            if (node.fileStat.isDirectory) {
                return node.uri.resolve(this.fileNameField.value);
            }
            return node.uri.parent.resolve(this.fileNameField.value);
        }
        return undefined;
    }
    init() {
        super.init();
        const { widget } = this;
        widget.addClass(SAVE_DIALOG_CLASS);
    }
    getAcceptButtonLabel() {
        return this.props.saveLabel ? this.props.saveLabel : 'Save';
    }
    onUpdateRequest(msg) {
        // Update file name field when changing a selection
        if (this.fileNameField) {
            if (this.widget.model.selectedFileStatNodes.length === 1) {
                const node = this.widget.model.selectedFileStatNodes[0];
                if (!node.fileStat.isDirectory) {
                    this.fileNameField.value = this.labelProvider.getName(node);
                }
            }
            else {
                this.fileNameField.value = '';
            }
        }
        // Continue updating the dialog
        super.onUpdateRequest(msg);
    }
    isValid(value) {
        if (this.fileNameField && this.fileNameField.value) {
            return '';
        }
        return false;
    }
    onAfterAttach(msg) {
        super.onAfterAttach(msg);
        const fileNamePanel = document.createElement('div');
        fileNamePanel.classList.add(FILENAME_PANEL_CLASS);
        this.contentNode.appendChild(fileNamePanel);
        const titlePanel = document.createElement('div');
        titlePanel.innerHTML = 'Name:';
        titlePanel.classList.add(FILENAME_LABEL_CLASS);
        fileNamePanel.appendChild(titlePanel);
        this.fileNameField = document.createElement('input');
        this.fileNameField.type = 'text';
        this.fileNameField.spellcheck = false;
        this.fileNameField.classList.add('tart-input', FILENAME_TEXTFIELD_CLASS);
        this.fileNameField.value = this.props.inputValue || '';
        fileNamePanel.appendChild(this.fileNameField);
        this.fileNameField.onkeyup = () => this.validate();
    }
};
__decorate([
    inject(LabelProvider)
], SaveFileDialog.prototype, "labelProvider", void 0);
__decorate([
    postConstruct()
], SaveFileDialog.prototype, "init", null);
SaveFileDialog = __decorate([
    injectable(),
    __param(0, inject(SaveFileDialogProps))
], SaveFileDialog);
export { SaveFileDialog };

//# sourceMappingURL=../../../lib/browser/file-dialog/file-dialog.js.map
