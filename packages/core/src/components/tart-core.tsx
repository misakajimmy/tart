import React, {useEffect, useRef, useState} from 'react';
import {ContainerLoader} from '../common';

let inited = false;

export function TartCore() {
  const coreRef = useRef<HTMLDivElement>(undefined);
  const [containerLoader] = useState<ContainerLoader>(new ContainerLoader());

  useEffect(() => {
    if (!inited) {
      inited = true;
      const modules = [
        'lib/browser/frontend-application-module'
      ];
      containerLoader.importModules(modules);
    }
  });

  return <div className={'tart-core'} ref={coreRef}>
    tart core
  </div>;
}
