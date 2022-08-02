import React, {useEffect, useRef, useState} from 'react';
import {ContainerLoader} from '@tart/core';

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
      let frontendApplication;
      import('@tart/core/lib/browser').then((module) => {
        frontendApplication = module.FrontendApplication;
      }).then(() => {
        containerLoader.importModules(modules).then(() => {
          // @ts-ignore
          // console.log(containerLoader.container.getAll());
          // const frontendApplication = FrontendApplication;
          containerLoader.getService(frontendApplication);
          // containerLoader.getService(FrontendApplication).start({host: coreRef.current});
        });
      })
      // frontendApplication.
    }
  });

  return <div className={'tart-core'} ref={coreRef}>
    tart core
  </div>;
}
