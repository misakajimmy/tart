import { FileStat } from '../common/files';
import { SelectionCommandHandler } from '@tart/core/lib/common';
export var FileSelection;
(function (FileSelection) {
    function is(arg) {
        return typeof arg === 'object' && ('fileStat' in arg) && FileStat.is(arg['fileStat']);
    }
    FileSelection.is = is;
    class CommandHandler extends SelectionCommandHandler {
        constructor(selectionService, options) {
            super(selectionService, arg => FileSelection.is(arg) ? arg : undefined, options);
            this.selectionService = selectionService;
            this.options = options;
        }
    }
    FileSelection.CommandHandler = CommandHandler;
})(FileSelection || (FileSelection = {}));

//# sourceMappingURL=../../lib/browser/file-selection.js.map
