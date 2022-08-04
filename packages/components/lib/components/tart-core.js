import { Promise } from 'bluebird';
import React, { useEffect, useRef, useState } from 'react';
import { FrontendApplication } from '@tart/core/lib/browser/frontend-application';
import { ContainerLoader } from '@tart/core/lib/common';
import { CoreInit } from '@tart/core/lib/init';
let inited = false;
export function TartCore() {
    const coreRef = useRef(undefined);
    const [containerLoader] = useState(new ContainerLoader());
    useEffect(() => {
        if (!inited) {
            inited = true;
            let modules = CoreInit.init();
            containerLoader.loadsAsync(modules).then(() => {
                return Promise.delay(3000);
            }).then(() => {
                containerLoader.getService(FrontendApplication).start({ host: coreRef.current });
            });
            // frontendApplication.
        }
    });
    return React.createElement("div", { className: 'tart-core', ref: coreRef });
}

//# sourceMappingURL=../../lib/components/tart-core.js.map
