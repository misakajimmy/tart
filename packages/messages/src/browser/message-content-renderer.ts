import {injectable} from 'inversify';
import markdownit from 'markdown-it';

@injectable()
export class MessageContentRenderer {
  protected readonly mdEngine = markdownit({ html: false });

  renderMessage(content: string): string {
    // in alignment with vscode, new lines aren't supported
    const contentWithoutNewlines = content.replace(/((\r)?\n)+/gm, ' ');

    return this.mdEngine.renderInline(contentWithoutNewlines);
  }
}
