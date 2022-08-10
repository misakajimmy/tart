import {FileStat} from '../common/files';
import {SelectionCommandHandler, SelectionService} from '@tartjs/core/lib/common';

export interface FileSelection {
    fileStat: FileStat
}

export namespace FileSelection {
    export function is(arg: Object | undefined): arg is FileSelection {
        return typeof arg === 'object' && ('fileStat' in arg) && FileStat.is(arg['fileStat']);
    }

    export class CommandHandler extends SelectionCommandHandler<FileSelection> {

        constructor(
            protected readonly selectionService: SelectionService,
            protected readonly options: SelectionCommandHandler.Options<FileSelection>
        ) {
            super(
                selectionService,
                arg => FileSelection.is(arg) ? arg : undefined,
                options
            );
        }

    }

}
