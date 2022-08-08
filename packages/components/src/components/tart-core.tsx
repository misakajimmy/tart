import React, {useEffect, useRef, useState} from 'react';
import {FrontendApplication} from '@tart/core/lib/browser/frontend-application';
import {ContainerLoader} from '@tart/core/lib/common';
import {CoreInit} from '@tart/core/lib/init';
import FilesystemInit from '@tart/filesystem/lib/init';
import EditorInit from '@tart/editor/lib/init';
import MonacoInit from '@tart/monaco/lib/init';

let inited = false;

export function TartCore() {
  const coreRef = useRef<HTMLDivElement>(undefined);
  const [containerLoader] = useState<ContainerLoader>(new ContainerLoader());

  useEffect(() => {
    if (!inited) {
      inited = true;
      const modules = [
        CoreInit.init(),
        FilesystemInit.init(),
        EditorInit.init(),
        MonacoInit.init(),
      ];
      containerLoader.loadsAsync(modules).then(() => {
      }).then(() => {
        containerLoader.getService<FrontendApplication>(FrontendApplication).start({host: coreRef.current});
      });
    }
  });

  return <div className={'tart-core'} ref={coreRef}>
  </div>;
}
