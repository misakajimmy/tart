import React from 'react';
import {Container, inject, injectable, interfaces, postConstruct} from 'inversify';
import {createFileTreeContainer, FileTreeWidget} from '@tartjs/filesystem';
import {nls} from '@tartjs/core/lib/common/nls';
import {
  ApplicationShell,
  ContextMenuRenderer,
  defaultTreeProps,
  NavigatableWidget,
  NodeProps,
  Saveable,
  TabBar,
  TREE_NODE_CONTENT_CLASS,
  TreeDecoratorService,
  TreeModel,
  TreeNode,
  TreeProps,
  TreeWidget,
  Widget
} from '@tartjs/core';
import {OpenEditorNode, OpenEditorsModel} from './navigator-open-editors-tree-model';
import {OpenEditorsCommands} from './navigator-open-editors-commands';
import {CommandService} from '@tartjs/core/lib/common';
import {OpenEditorsTreeDecoratorService} from './navigator-open-editors-decorator-service';
import {OPEN_EDITORS_CONTEXT_MENU} from './navigator-open-editors-menus';

export const OPEN_EDITORS_PROPS: TreeProps = {
  ...defaultTreeProps,
  virtualized: false,
  contextMenuPath: OPEN_EDITORS_CONTEXT_MENU,
};

export interface OpenEditorsNodeRow extends TreeWidget.NodeRow {
  node: OpenEditorNode;
}

@injectable()
export class OpenEditorsWidget extends FileTreeWidget {
  static ID = 'wm-open-editors-widget';
  static LABEL = nls.localizeByDefault('Open Editors');

  @inject(ApplicationShell) protected readonly applicationShell: ApplicationShell;
  @inject(CommandService) protected readonly commandService: CommandService;
  // eslint-disable-next-line no-null/no-null
  protected activeTreeNodePrefixElement: string | undefined | null;

  constructor(
      @inject(TreeProps) readonly props: TreeProps,
      @inject(OpenEditorsModel) readonly model: OpenEditorsModel,
      @inject(ContextMenuRenderer) protected readonly contextMenuRenderer: ContextMenuRenderer
  ) {
    super(props, model, contextMenuRenderer);
  }

  get editorWidgets(): NavigatableWidget[] {
    return this.model.editorWidgets;
  }

  static createContainer(parent: interfaces.Container): Container {
    const child = createFileTreeContainer(parent);

    child.bind(OpenEditorsModel).toSelf();
    child.rebind(TreeModel).toService(OpenEditorsModel);

    child.bind(OpenEditorsWidget).toSelf();
    child.rebind(TreeProps).toConstantValue(OPEN_EDITORS_PROPS);

    child.bind(OpenEditorsTreeDecoratorService).toSelf().inSingletonScope();
    child.rebind(TreeDecoratorService).toService(OpenEditorsTreeDecoratorService);
    return child;
  }

  static createWidget(parent: interfaces.Container): OpenEditorsWidget {
    return OpenEditorsWidget.createContainer(parent).get(OpenEditorsWidget);
  }

  @postConstruct()
  init(): void {
    super.init();
    this.id = OpenEditorsWidget.ID;
    this.title.label = OpenEditorsWidget.LABEL;
    this.addClass(OpenEditorsWidget.ID);
    this.update();
  }

  protected renderNode(node: OpenEditorNode, props: NodeProps): React.ReactNode {
    if (!TreeNode.isVisible(node)) {
      return undefined;
    }
    const attributes = this.createNodeAttributes(node, props);
    const isEditorNode = !(node.id.startsWith(OpenEditorsModel.GROUP_NODE_ID_PREFIX) || node.id.startsWith(OpenEditorsModel.AREA_NODE_ID_PREFIX));
    const content = <div className={`${TREE_NODE_CONTENT_CLASS}`}>
      {this.renderExpansionToggle(node, props)}
      {isEditorNode && this.renderPrefixIcon(node)}
      {this.decorateIcon(node, this.renderIcon(node, props))}
      {this.renderCaptionAffixes(node, props, 'captionPrefixes')}
      {this.renderCaption(node, props)}
      {this.renderCaptionAffixes(node, props, 'captionSuffixes')}
      {this.renderTailDecorations(node, props)}
      {(this.isGroupNode(node) || this.isAreaNode(node)) && this.renderInteractables(node, props)}
    </div>;
    return React.createElement('div', attributes, content);
  }

  protected isGroupNode(node: OpenEditorNode): boolean {
    return node.id.startsWith(OpenEditorsModel.GROUP_NODE_ID_PREFIX);
  }

  protected isAreaNode(node: OpenEditorNode): boolean {
    return node.id.startsWith(OpenEditorsModel.AREA_NODE_ID_PREFIX);
  }

  protected doRenderNodeRow({node, depth}: OpenEditorsNodeRow): React.ReactNode {
    let groupClass = '';
    if (this.isGroupNode(node)) {
      groupClass = 'group-node';
    } else if (this.isAreaNode(node)) {
      groupClass = 'area-node';
    }
    return <div className={`open-editors-node-row ${this.getPrefixIconClass(node)}${groupClass}`}>
      {this.renderNode(node, {depth})}
    </div>;
  }


  protected renderInteractables(node: OpenEditorNode, props: NodeProps): React.ReactNode {
    return (<div className='open-editors-inline-actions-container'>
          <div className='open-editors-inline-action'>
            <a className='codicon codicon-save-all'
               title={OpenEditorsCommands.SAVE_ALL_IN_GROUP_FROM_ICON.label}
               onClick={this.handleGroupActionIconClicked}
               data-id={node.id}
               id={OpenEditorsCommands.SAVE_ALL_IN_GROUP_FROM_ICON.id}
            />
          </div>
          <div className='open-editors-inline-action'>
            <a className='codicon codicon-close-all'
               title={OpenEditorsCommands.CLOSE_ALL_EDITORS_IN_GROUP_FROM_ICON.label}
               onClick={this.handleGroupActionIconClicked}
               data-id={node.id}
               id={OpenEditorsCommands.CLOSE_ALL_EDITORS_IN_GROUP_FROM_ICON.id}
            />
          </div>
        </div>
    );
  }

  protected getPrefixIconClass(node: OpenEditorNode): string {
    const saveable = Saveable.get(node.widget);
    if (saveable) {
      return saveable.dirty ? 'dirty' : '';
    }
    return '';
  }

  protected handleGroupActionIconClicked = async (e: React.MouseEvent<HTMLAnchorElement>) => this.doHandleGroupActionIconClicked(e);

  protected async doHandleGroupActionIconClicked(e: React.MouseEvent<HTMLAnchorElement>): Promise<void> {
    e.stopPropagation();
    const groupName = e.currentTarget.getAttribute('data-id');
    const command = e.currentTarget.id;
    if (groupName && command) {
      const groupFromTarget: string | number | undefined = groupName.split(':').pop();
      const areaOrTabBar = this.sanitizeInputFromClickHandler(groupFromTarget);
      if (areaOrTabBar) {
        return this.commandService.executeCommand(command, areaOrTabBar);
      }
    }
  }

  protected sanitizeInputFromClickHandler(groupFromTarget?: string): ApplicationShell.Area | TabBar<Widget> | undefined {
    let areaOrTabBar: ApplicationShell.Area | TabBar<Widget> | undefined;
    if (groupFromTarget) {
      if (ApplicationShell.isValidArea(groupFromTarget)) {
        areaOrTabBar = groupFromTarget;
      } else {
        const groupAsNum = parseInt(groupFromTarget);
        if (!isNaN(groupAsNum)) {
          areaOrTabBar = this.model.getTabBarForGroup(groupAsNum);
        }
      }
    }
    return areaOrTabBar;
  }

  protected renderPrefixIcon(node: OpenEditorNode): React.ReactNode {
    return (
        <div className='open-editors-prefix-icon-container'>
          <div data-id={node.id}
               className='open-editors-prefix-icon dirty codicon codicon-circle-filled'
          />
          <div data-id={node.id}
               onClick={this.closeEditor}
               className='open-editors-prefix-icon close codicon codicon-close'
          />
        </div>);
  }

  protected closeEditor = async (e: React.MouseEvent<HTMLDivElement>) => {
    this.doCloseEditor(e)
  };

  protected async doCloseEditor(e: React.MouseEvent<HTMLDivElement>): Promise<void> {
    const widgetId = e.currentTarget.getAttribute('data-id');
    if (widgetId) {
      await this.applicationShell.closeWidget(widgetId);
    }
  }
}
