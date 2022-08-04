/********************************************************************************
 * Copyright (C) 2018 TypeFox and others.
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
export var ApplicationError;
(function (ApplicationError) {
    const codes = [];
    function declare(code, factory) {
        if (codes.indexOf(code) !== -1) {
            throw new Error(`An application error for '${code}' code is already declared`);
        }
        const constructorOpt = Object.assign((...args) => new Impl(code, factory(...args), constructorOpt), {
            code,
            is(arg) {
                return arg instanceof Impl && arg.code === code;
            }
        });
        return constructorOpt;
    }
    ApplicationError.declare = declare;
    function is(arg) {
        return arg instanceof Impl;
    }
    ApplicationError.is = is;
    function fromJson(code, raw) {
        return new Impl(code, raw);
    }
    ApplicationError.fromJson = fromJson;
    class Impl extends Error {
        code;
        data;
        constructor(code, raw, constructorOpt) {
            super(raw.message);
            this.code = code;
            this.data = raw.data;
            Object.setPrototypeOf(this, Impl.prototype);
            if (raw.stack) {
                this.stack = raw.stack;
            }
        }
        toJson() {
            const { message, data, stack } = this;
            return { message, data, stack };
        }
    }
})(ApplicationError || (ApplicationError = {}));

//# sourceMappingURL=../../lib/common/application-error.js.map
