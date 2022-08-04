/********************************************************************************
 * Copyright (C) 2019 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
import { TreeWidget } from './tree-widget';
export var TreeWidgetSelection;
(function (TreeWidgetSelection) {
    function isSource(selection, source) {
        return getSource(selection) === source;
    }
    TreeWidgetSelection.isSource = isSource;
    function getSource(selection) {
        return is(selection) ? selection.source : undefined;
    }
    TreeWidgetSelection.getSource = getSource;
    function is(selection) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return Array.isArray(selection) && ('source' in selection) && selection['source'] instanceof TreeWidget;
    }
    TreeWidgetSelection.is = is;
    function create(source) {
        return Object.assign(source.model.selectedNodes, { source });
    }
    TreeWidgetSelection.create = create;
})(TreeWidgetSelection || (TreeWidgetSelection = {}));

//# sourceMappingURL=../../../lib/browser/tree/tree-widget-selection.js.map
