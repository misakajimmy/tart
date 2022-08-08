import React from 'react';
import {inject, injectable, postConstruct} from 'inversify';
import {DirNode, FileNode, FileStatNode, FileTreeWidget} from '@tart/filesystem';
import {
  ApplicationShell,
  ContextMenuRenderer,
  ExpandableTreeNode,
  Key,
  NodeProps,
  OpenerService,
  SelectableTreeNode,
  TREE_NODE_SEGMENT_CLASS,
  TREE_NODE_TAIL_CLASS,
  TreeDecoration,
  TreeModel,
  TreeNode,
  TreeProps
} from '@tart/core';
import {FileNavigatorModel} from './navigator-model';
import {nls} from '@tart/core/lib/common/nls';
import {WorkspaceNode, WorkspaceRootNode} from './navigator-tree';
import {CommandService, isOSX, notEmpty} from '@tart/core/lib/common';
import {Message} from '@lumino/messaging';
import {NavigatorContextKeyService} from './navigator-context-key-service';
import URI from '@tart/core/lib/common/uri';
import {FileNavigatorCommands} from './navigator-contribution';

export const FILE_NAVIGATOR_ID = 'files';
export const LABEL = nls.localizeByDefault('No Folder Opened');
export const CLASS = 'wm-Files';

@injectable()
export class FileNavigatorWidget extends FileTreeWidget {

  @inject(NavigatorContextKeyService)
  protected readonly contextKeyService: NavigatorContextKeyService;

  @inject(OpenerService) protected readonly openerService: OpenerService;

  constructor(
      @inject(TreeProps) readonly props: TreeProps,
      @inject(FileNavigatorModel) readonly model: FileNavigatorModel,
      @inject(CommandService) protected readonly commandService: CommandService,
      @inject(ContextMenuRenderer) contextMenuRenderer: ContextMenuRenderer,
      @inject(ApplicationShell) protected readonly shell: ApplicationShell,
  ) {
    super(props, model, contextMenuRenderer);
    console.log(model);
    this.id = FILE_NAVIGATOR_ID;
    this.addClass(CLASS);
  }

  @postConstruct()
  protected init() {
    super.init();
    // This ensures that the context menu command to hide this widget receives the label 'Folders'
    // regardless of the name of workspace. See ViewContainer.updateToolbarItems.
    const dataset = {...this.title.dataset, visibilityCommandLabel: nls.localizeByDefault('Folders')};
    this.title.dataset = dataset;
    this.updateSelectionContextKeys();
    this.toDispose.pushAll([
      this.model.onSelectionChanged(() =>
          this.updateSelectionContextKeys()
      ),
      this.model.onExpansionChanged(node => {
        if (node.expanded && node.children.length === 1) {
          const child = node.children[0];
          if (ExpandableTreeNode.is(child) && !child.expanded) {
            this.model.expandNode(child);
          }
        }
      })
    ]);
  }

  protected renderTree(model: TreeModel): React.ReactNode {
    if (this.model.root && this.isEmptyMultiRootWorkspace(model)) {
      return this.renderEmptyMultiRootWorkspace();
    }
    return super.renderTree(model);
  }

  /**
   * When a multi-root workspace is opened, a user can remove all the folders from it.
   * Instead of displaying an empty navigator tree, this will show a button to add more folders.
   */
  protected renderEmptyMultiRootWorkspace(): React.ReactNode {
    // TODO: @msujew Implement a markdown renderer and use vscode/explorerViewlet/noFolderHelp
    return <div className='wm-navigator-container'>
      <div className='center'>You have not yet added a folder to the workspace.</div>
      <div className='open-workspace-button-container'>
        <button className='wm-button open-workspace-button' title='Add a folder to your workspace'
                onClick={this.addFolder}
                onKeyUp={this.keyUpHandler}>
          Add Folder
        </button>
      </div>
    </div>;
  }

  protected readonly addFolder = () => this.doAddFolder();

  protected doAddFolder(): void {
    // this.commandService.executeCommand(WorkspaceCommands.ADD_FOLDER.id);
  }

  protected readonly keyUpHandler = (e: React.KeyboardEvent) => {
    if (Key.ENTER.keyCode === e.keyCode) {
      (e.target as HTMLElement).click();
    }
  };

  protected doUpdateRows(): void {
    super.doUpdateRows();
    this.title.label = LABEL;
    if (WorkspaceNode.is(this.model.root)) {
      if (this.model.root.name === WorkspaceNode.name) {
        const rootNode = this.model.root.children[0];
        if (WorkspaceRootNode.is(rootNode)) {
          this.title.label = this.toNodeName(rootNode);
          this.title.caption = this.labelProvider.getLongName(rootNode.uri);
        }
      } else {
        this.title.label = this.toNodeName(this.model.root);
        this.title.caption = this.title.label;
      }
    } else {
      this.title.caption = this.title.label;
    }
  }

  protected onAfterAttach(msg: Message) {
    super.onAfterAttach(msg);
    this.addClipboardListener(this.node, 'copy', e => this.handleCopy(e));
    this.addClipboardListener(this.node, 'paste', e => this.handlePaste(e));
    this.enableDndOnMainPanel();
  }

  protected handleCopy(event: ClipboardEvent): void {
    const uris = this.model.selectedFileStatNodes.map(node => node.uri.toString());
    if (uris.length > 0 && event.clipboardData) {
      event.clipboardData.setData('text/plain', uris.join('\n'));
      event.preventDefault();
    }
  }

  protected handlePaste(event: ClipboardEvent): void {
    if (event.clipboardData) {
      const raw = event.clipboardData.getData('text/plain');
      if (!raw) {
        return;
      }
      const target = this.model.selectedFileStatNodes[0];
      if (!target) {
        return;
      }
      for (const file of raw.split('\n')) {
        event.preventDefault();
        const source = new URI(file);
        this.model.copy(source, target);
      }
    }
  }

  protected enableDndOnMainPanel(): void {
    const mainPanelNode = this.shell.mainPanel.node;
    this.addEventListener(mainPanelNode, 'drop', async ({dataTransfer}) => {
      const treeNodes = dataTransfer && this.getSelectedTreeNodesFromData(dataTransfer) || [];
      if (treeNodes.length > 0) {
        treeNodes.filter(FileNode.is).forEach(treeNode => {
          if (!SelectableTreeNode.isSelected(treeNode)) {
            this.model.toggleNode(treeNode);
          }
        });
        this.commandService.executeCommand(FileNavigatorCommands.OPEN.id);
      } else if (dataTransfer && dataTransfer.files?.length > 0) {
        // the files were dragged from the outside the workspace
        // Array.from(dataTransfer.files).forEach(async file => {
        //     const fileUri = new URI(file.path);
        //     const opener = await this.openerService.getOpener(fileUri);
        //     opener.open(fileUri);
        // });
      }
    });
    const handler = (e: DragEvent) => {
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'link';
        e.preventDefault();
      }
    };
    this.addEventListener(mainPanelNode, 'dragover', handler);
    this.addEventListener(mainPanelNode, 'dragenter', handler);
  }

  protected getSelectedTreeNodesFromData(data: DataTransfer): TreeNode[] {
    const resources = data.getData('selected-tree-nodes');
    if (!resources) {
      return [];
    }
    const ids: string[] = JSON.parse(resources);
    return ids.map(id => this.model.getNode(id)).filter(node => node !== undefined) as TreeNode[];
  }

  protected renderTailDecorations(node: TreeNode, props: NodeProps): React.ReactNode {
    const tailDecorations = this.getDecorationData(node, 'tailDecorations').filter(notEmpty).reduce((acc, current) => acc.concat(current), []);

    if (tailDecorations.length === 0) {
      return;
    }

    // Handle rendering of directories versus file nodes.
    if (FileStatNode.is(node) && node.fileStat.isDirectory) {
      return this.renderTailDecorationsForDirectoryNode(node, props, tailDecorations);
    } else {
      return this.renderTailDecorationsForNode(node, props, tailDecorations);
    }
  }

  protected renderTailDecorationsForDirectoryNode(node: TreeNode, props: NodeProps, tailDecorations:
      (TreeDecoration.TailDecoration | TreeDecoration.TailDecorationIcon | TreeDecoration.TailDecorationIconClass)[]): React.ReactNode {
    // If the node represents a directory, we just want to use the decorationData with the highest priority (last element).
    const decoration = tailDecorations[tailDecorations.length - 1];
    const {tooltip, fontData} = decoration as TreeDecoration.TailDecoration;
    const color = (decoration as TreeDecoration.TailDecorationIcon).color;
    const className = [TREE_NODE_SEGMENT_CLASS, TREE_NODE_TAIL_CLASS].join(' ');
    const style = fontData ? this.applyFontStyles({}, fontData) : color ? {color} : undefined;
    const content = <span
        className={this.getIconClass('circle', [TreeDecoration.Styles.DECORATOR_SIZE_CLASS])}/>;

    return <div className={className} style={style} title={tooltip}>
      {content}
    </div>;
  }

  protected isEmptyMultiRootWorkspace(model: TreeModel): boolean {
    return WorkspaceNode.is(model.root) && model.root.children.length === 0;
  }

  protected handleClickEvent(node: TreeNode | undefined, event: React.MouseEvent<HTMLElement>): void {
    const modifierKeyCombined: boolean = isOSX ? (event.shiftKey || event.metaKey) : (event.shiftKey || event.ctrlKey);
    // if (!modifierKeyCombined && node && this.corePreferences['workbench.list.openMode'] === 'singleClick') {
    if (!modifierKeyCombined && node) {
      this.model.previewNode(node);
    }
    super.handleClickEvent(node, event);
  }

  protected onAfterShow(msg: Message): void {
    super.onAfterShow(msg);
    this.contextKeyService.explorerViewletVisible.set(true);
  }

  protected onAfterHide(msg: Message): void {
    super.onAfterHide(msg);
    this.contextKeyService.explorerViewletVisible.set(false);
  }

  protected updateSelectionContextKeys(): void {
    this.contextKeyService.explorerResourceIsFolder.set(DirNode.is(this.model.selectedNodes[0]));
  }
}
