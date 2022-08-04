import { FileStat } from '../common/files';
import { SelectionCommandHandler, SelectionService } from '@tart/core/lib/common';
export interface FileSelection {
    fileStat: FileStat;
}
export declare namespace FileSelection {
    function is(arg: Object | undefined): arg is FileSelection;
    class CommandHandler extends SelectionCommandHandler<FileSelection> {
        protected readonly selectionService: SelectionService;
        protected readonly options: SelectionCommandHandler.Options<FileSelection>;
        constructor(selectionService: SelectionService, options: SelectionCommandHandler.Options<FileSelection>);
    }
}
