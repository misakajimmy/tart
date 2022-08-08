import {inject, injectable, postConstruct} from 'inversify';
import {ContextKey, ContextKeyService} from '@tart/core';

@injectable()
export class NavigatorContextKeyService {

  @inject(ContextKeyService)
  protected readonly contextKeyService: ContextKeyService;

  protected _explorerViewletVisible: ContextKey<boolean>;
  get explorerViewletVisible(): ContextKey<boolean> {
    return this._explorerViewletVisible;
  }

  protected _explorerViewletFocus: ContextKey<boolean>;
  /** True if Explorer view has keyboard focus. */
  get explorerViewletFocus(): ContextKey<boolean> {
    return this._explorerViewletFocus;
  }

  protected _filesExplorerFocus: ContextKey<boolean>;
  /** True if File Explorer section has keyboard focus. */
  get filesExplorerFocus(): ContextKey<boolean> {
    return this._filesExplorerFocus;
  }

  protected _explorerResourceIsFolder: ContextKey<boolean>;
  get explorerResourceIsFolder(): ContextKey<boolean> {
    return this._explorerResourceIsFolder;
  }

  @postConstruct()
  protected init(): void {
    this._explorerViewletVisible = this.contextKeyService.createKey<boolean>('explorerViewletVisible', false);
    this._explorerViewletFocus = this.contextKeyService.createKey<boolean>('explorerViewletFocus', false);
    this._filesExplorerFocus = this.contextKeyService.createKey<boolean>('filesExplorerFocus', false);
    this._explorerResourceIsFolder = this.contextKeyService.createKey<boolean>('explorerResourceIsFolder', false);
  }

}
