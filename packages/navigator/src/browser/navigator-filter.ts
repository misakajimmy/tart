/**
 * Filter for omitting elements from the navigator. For more details on the exclusion patterns,
 * one should check either the manual with `man 5 gitignore` or just [here](https://git-scm.com/docs/gitignore).
 */
import {inject, injectable, postConstruct} from 'inversify';
import {Minimatch} from 'minimatch';
import {Emitter, Event, MaybePromise} from '@tart/core/lib/common';
import {FileSystemConfiguration, FileSystemPreferences} from '@tart/filesystem/lib/browser/filesystem-preferences';
import {FileNavigatorConfiguration, FileNavigatorPreferences} from './navigator-preferences';
import {PreferenceChangeEvent} from '@tart/core';

@injectable()
export class FileNavigatorFilter {
  protected readonly emitter: Emitter<void> = new Emitter<void>();

  protected filterPredicate: FileNavigatorFilter.Predicate;
  protected showHiddenFiles: boolean;

  @inject(FileSystemPreferences)
  protected readonly filesPreferences: FileSystemPreferences;

  constructor(
      @inject(FileNavigatorPreferences) protected readonly preferences: FileNavigatorPreferences
  ) {
  }

  get onFilterChanged(): Event<void> {
    return this.emitter.event;
  }

  async filter<T extends { id: string }>(items: MaybePromise<T[]>): Promise<T[]> {
    return (await items).filter(item => this.filterItem(item));
  }

  toggleHiddenFiles(): void {
    this.showHiddenFiles = !this.showHiddenFiles;
    const filesExcludes = this.filesPreferences['files.exclude'];

    this.filterPredicate = this.createFilterPredicate(filesExcludes || {});
    this.fireFilterChanged();
  }

  @postConstruct()
  protected async init(): Promise<void> {
    this.filterPredicate = this.createFilterPredicate(this.filesPreferences['files.exclude']);
    this.filesPreferences.onPreferenceChanged(event => this.onFilesPreferenceChanged(event));
    this.preferences.onPreferenceChanged(event => this.onPreferenceChanged(event));
  }

  protected filterItem(item: { id: string }): boolean {
    return this.filterPredicate.filter(item);
  }

  protected fireFilterChanged(): void {
    this.emitter.fire(undefined);
  }

  protected onFilesPreferenceChanged(event: PreferenceChangeEvent<FileSystemConfiguration>): void {
    const {preferenceName, newValue} = event;
    if (preferenceName === 'files.exclude') {
      this.filterPredicate = this.createFilterPredicate(newValue as FileNavigatorFilter.Exclusions | undefined || {});
      this.fireFilterChanged();
    }
  }

  protected onPreferenceChanged(event: PreferenceChangeEvent<FileNavigatorConfiguration>): void {
  }

  protected createFilterPredicate(exclusions: FileNavigatorFilter.Exclusions): FileNavigatorFilter.Predicate {
    return new FileNavigatorFilterPredicate(this.interceptExclusions(exclusions));
  }

  protected interceptExclusions(exclusions: FileNavigatorFilter.Exclusions): FileNavigatorFilter.Exclusions {
    return {
      ...exclusions,
      '**/.*': this.showHiddenFiles
    };
  }

}

export namespace FileNavigatorFilter {

  /**
   * File navigator filter predicate.
   */
  export interface Predicate {

    /**
     * Returns `true` if the item should filtered our from the navigator. Otherwise, `true`.
     *
     * @param item the identifier of a tree node.
     */
    filter(item: { id: string }): boolean;

  }

  export namespace Predicate {

    /**
     * Wraps a bunch of predicates and returns with a new one that evaluates to `true` if
     * each of the wrapped predicates evaluates to `true`. Otherwise, `false`.
     */
    export function and(...predicates: Predicate[]): Predicate {
      return {
        filter: id => predicates.every(predicate => predicate.filter(id))
      };
    }

  }

  /**
   * Type for the exclusion patterns. The property keys are the patterns, values are whether the exclusion is enabled or not.
   */
  export interface Exclusions {
    [key: string]: boolean;
  }

}

/**
 * Concrete filter navigator filter predicate that is decoupled from the preferences.
 */
export class FileNavigatorFilterPredicate implements FileNavigatorFilter.Predicate {

  private readonly delegate: FileNavigatorFilter.Predicate;

  constructor(exclusions: FileNavigatorFilter.Exclusions) {
    const patterns = Object.keys(exclusions).map(pattern => ({
      pattern,
      enabled: exclusions[pattern]
    })).filter(object => object.enabled).map(object => object.pattern);
    this.delegate = FileNavigatorFilter.Predicate.and(...patterns.map(pattern => this.createDelegate(pattern)));
  }

  filter(item: { id: string }): boolean {
    return this.delegate.filter(item);
  }

  protected createDelegate(pattern: string): FileNavigatorFilter.Predicate {
    const delegate = new Minimatch(pattern, {matchBase: true});
    return {
      filter: item => !delegate.match(item.id)
    };
  }

}
