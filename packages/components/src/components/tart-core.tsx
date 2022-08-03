import React, {useEffect, useRef, useState} from 'react';
import {ContainerLoader} from '@tart/core';
import {FrontendApplication} from '@tart/core/lib/browser/frontend-application';
import {Promise} from 'bluebird';

let inited = false;
export function TartCore() {
  const coreRef = useRef<HTMLDivElement>(undefined);
  const [containerLoader] = useState<ContainerLoader>(new ContainerLoader());

  useEffect(() => {
    if (!inited) {
      inited = true;
      const modules = [
        '@tart/core/lib/browser/frontend-application-module.js'
      ];
      containerLoader.importModules(modules).then(() => {
        return Promise.delay(1000);
      }).then(() => {
        console.log(containerLoader.container);
        containerLoader.getService<FrontendApplication>(FrontendApplication).start({host: coreRef.current});
      });
      // frontendApplication.
    }
  });

  return <div className={'tart-core'} ref={coreRef}>
    tart core
  </div>;
}
