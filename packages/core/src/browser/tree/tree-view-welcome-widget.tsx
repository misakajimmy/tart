import {inject, injectable} from 'inversify';
import * as React from 'react';
import {CommandRegistry} from '../../common';
import {ContextKeyService} from '../context-key-service';
import {WindowService} from '../window';
import {TreeModel} from './tree-model';
import {TreeWidget} from './tree-widget';

interface ViewWelcome {
  readonly view: string;
  readonly content: string;
  readonly when?: string;
  readonly order: number;
}

interface IItem {
  readonly welcomeInfo: ViewWelcome;
  visible: boolean;
}

interface ILink {
  readonly label: string;
  readonly href: string;
  readonly title?: string;
}

type LinkedTextItem = string | ILink;

@injectable()
export class TreeViewWelcomeWidget extends TreeWidget {

  @inject(CommandRegistry)
  protected readonly commands: CommandRegistry;

  @inject(ContextKeyService)
  protected readonly contextService: ContextKeyService;

  @inject(WindowService)
  protected readonly windowService: WindowService;

  protected viewWelcomeNodes: React.ReactNode[] = [];
  protected defaultItem: IItem | undefined;
  protected items: IItem[] = [];

  get visibleItems(): ViewWelcome[] {
    const visibleItems = this.items.filter(v => v.visible);
    if (visibleItems.length && this.defaultItem) {
      return [this.defaultItem.welcomeInfo];
    }
    return visibleItems.map(v => v.welcomeInfo);
  }

  handleViewWelcomeContentChange(viewWelcomes: ViewWelcome[]): void {
    this.items = [];
    for (const welcomeInfo of viewWelcomes) {
      if (welcomeInfo.when === 'default') {
        this.defaultItem = {welcomeInfo, visible: true};
      } else {
        const visible = welcomeInfo.when === undefined || this.contextService.match(welcomeInfo.when);
        this.items.push({welcomeInfo, visible});
      }
    }
    this.updateViewWelcomeNodes();
    this.update();
  }

  handleWelcomeContextChange(): void {
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

  protected renderTree(model: TreeModel): React.ReactNode {
    if (this.shouldShowWelcomeView() && this.visibleItems.length) {
      return this.renderViewWelcome();
    }
    return super.renderTree(model);
  }

  protected shouldShowWelcomeView(): boolean {
    return false;
  }

  protected renderViewWelcome(): React.ReactNode {
    return (
        <div className='tart-WelcomeView'>
          {...this.viewWelcomeNodes}
        </div>
    );
  }

  protected updateViewWelcomeNodes(): void {
    this.viewWelcomeNodes = [];
    const items = this.visibleItems.sort((a, b) => a.order - b.order);

    for (const [iIndex, {content}] of items.entries()) {
      const lines = content.split('\n');

      for (let [lIndex, line] of lines.entries()) {
        const lineKey = `${iIndex}-${lIndex}`;
        line = line.trim();

        if (!line) {
          continue;
        }

        const linkedTextItems = this.parseLinkedText(line);

        if (linkedTextItems.length === 1 && typeof linkedTextItems[0] !== 'string') {
          this.viewWelcomeNodes.push(
              this.renderButtonNode(linkedTextItems[0], lineKey)
          );
        } else {
          const linkedTextNodes: React.ReactNode[] = [];

          for (const [nIndex, node] of linkedTextItems.entries()) {
            const linkedTextKey = `${lineKey}-${nIndex}`;

            if (typeof node === 'string') {
              linkedTextNodes.push(
                  this.renderTextNode(node, linkedTextKey)
              );
            } else {
              linkedTextNodes.push(
                  this.renderCommandLinkNode(node, linkedTextKey)
              );
            }
          }

          this.viewWelcomeNodes.push(
              <div key={`line-${lineKey}`}>
                {...linkedTextNodes}
              </div>
          );
        }
      }
    }
  }

  protected renderButtonNode(node: ILink, lineKey: string): React.ReactNode {
    return (
        <div key={`line-${lineKey}`} className='tart-WelcomeViewButtonWrapper'>
          <button title={node.title}
                  className='tart-button tart-WelcomeViewButton'
                  disabled={!this.isEnabledClick(node.href)}
                  onClick={e => this.openLinkOrCommand(e, node.href)}>
            {node.label}
          </button>
        </div>
    );
  }

  protected renderTextNode(node: string, textKey: string): React.ReactNode {
    return <span key={`text-${textKey}`}>{node}</span>;
  }

  protected renderCommandLinkNode(node: ILink, linkKey: string): React.ReactNode {
    return (
        <a key={`link-${linkKey}`}
           className={this.getLinkClassName(node.href)}
           title={node.title || ''}
           onClick={e => this.openLinkOrCommand(e, node.href)}>
          {node.label}
        </a>
    );
  }

  protected getLinkClassName(href: string): string {
    const classNames = ['tart-WelcomeViewCommandLink'];
    if (!this.isEnabledClick(href)) {
      classNames.push('disabled');
    }
    return classNames.join(' ');
  }

  protected isEnabledClick(href: string): boolean {
    if (href.startsWith('command:')) {
      const command = href.replace('command:', '');
      return this.commands.isEnabled(command);
    }
    return true;
  }

  protected openLinkOrCommand = (event: React.MouseEvent, href: string): void => {
    event.stopPropagation();

    if (href.startsWith('command:')) {
      const command = href.replace('command:', '');
      this.commands.executeCommand(command);
    } else {
      this.windowService.openNewWindow(href, {external: true});
    }
  };

  protected parseLinkedText(text: string): LinkedTextItem[] {
    const result: LinkedTextItem[] = [];

    const linkRegex = /\[([^\]]+)\]\(((?:https?:\/\/|command:)[^\)\s]+)(?: ("|')([^\3]+)(\3))?\)/gi;
    let index = 0;
    let match: RegExpExecArray | null;

    while (match = linkRegex.exec(text)) {
      if (match.index - index > 0) {
        result.push(text.substring(index, match.index));
      }

      const [, label, href, , title] = match;

      if (title) {
        result.push({label, href, title});
      } else {
        result.push({label, href});
      }

      index = match.index + match[0].length;
    }

    if (index < text.length) {
      result.push(text.substring(index));
    }

    return result;
  }
}
