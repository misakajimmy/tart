var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
/**
 * Filter for omitting elements from the navigator. For more details on the exclusion patterns,
 * one should check either the manual with `man 5 gitignore` or just [here](https://git-scm.com/docs/gitignore).
 */
import { inject, injectable, postConstruct } from 'inversify';
import { Minimatch } from 'minimatch';
import { Emitter } from '@tart/core/lib/common';
import { FileSystemPreferences } from '@tart/filesystem/lib/browser/filesystem-preferences';
import { FileNavigatorPreferences } from './navigator-preferences';
let FileNavigatorFilter = class FileNavigatorFilter {
    constructor(preferences) {
        this.preferences = preferences;
        this.emitter = new Emitter();
    }
    get onFilterChanged() {
        return this.emitter.event;
    }
    async filter(items) {
        return (await items).filter(item => this.filterItem(item));
    }
    toggleHiddenFiles() {
        this.showHiddenFiles = !this.showHiddenFiles;
        const filesExcludes = this.filesPreferences['files.exclude'];
        this.filterPredicate = this.createFilterPredicate(filesExcludes || {});
        this.fireFilterChanged();
    }
    async init() {
        this.filterPredicate = this.createFilterPredicate(this.filesPreferences['files.exclude']);
        this.filesPreferences.onPreferenceChanged(event => this.onFilesPreferenceChanged(event));
        this.preferences.onPreferenceChanged(event => this.onPreferenceChanged(event));
    }
    filterItem(item) {
        return this.filterPredicate.filter(item);
    }
    fireFilterChanged() {
        this.emitter.fire(undefined);
    }
    onFilesPreferenceChanged(event) {
        const { preferenceName, newValue } = event;
        if (preferenceName === 'files.exclude') {
            this.filterPredicate = this.createFilterPredicate(newValue || {});
            this.fireFilterChanged();
        }
    }
    onPreferenceChanged(event) {
    }
    createFilterPredicate(exclusions) {
        return new FileNavigatorFilterPredicate(this.interceptExclusions(exclusions));
    }
    interceptExclusions(exclusions) {
        return Object.assign(Object.assign({}, exclusions), { '**/.*': this.showHiddenFiles });
    }
};
__decorate([
    inject(FileSystemPreferences)
], FileNavigatorFilter.prototype, "filesPreferences", void 0);
__decorate([
    postConstruct()
], FileNavigatorFilter.prototype, "init", null);
FileNavigatorFilter = __decorate([
    injectable(),
    __param(0, inject(FileNavigatorPreferences))
], FileNavigatorFilter);
export { FileNavigatorFilter };
(function (FileNavigatorFilter) {
    let Predicate;
    (function (Predicate) {
        /**
         * Wraps a bunch of predicates and returns with a new one that evaluates to `true` if
         * each of the wrapped predicates evaluates to `true`. Otherwise, `false`.
         */
        function and(...predicates) {
            return {
                filter: id => predicates.every(predicate => predicate.filter(id))
            };
        }
        Predicate.and = and;
    })(Predicate = FileNavigatorFilter.Predicate || (FileNavigatorFilter.Predicate = {}));
})(FileNavigatorFilter || (FileNavigatorFilter = {}));
/**
 * Concrete filter navigator filter predicate that is decoupled from the preferences.
 */
export class FileNavigatorFilterPredicate {
    constructor(exclusions) {
        const patterns = Object.keys(exclusions).map(pattern => ({
            pattern,
            enabled: exclusions[pattern]
        })).filter(object => object.enabled).map(object => object.pattern);
        this.delegate = FileNavigatorFilter.Predicate.and(...patterns.map(pattern => this.createDelegate(pattern)));
    }
    filter(item) {
        return this.delegate.filter(item);
    }
    createDelegate(pattern) {
        const delegate = new Minimatch(pattern, { matchBase: true });
        return {
            filter: item => !delegate.match(item.id)
        };
    }
}

//# sourceMappingURL=../../lib/browser/navigator-filter.js.map
