import React, {useEffect, useRef, useState} from 'react';
import {FrontendApplication} from '@tartjs/core/lib/browser/frontend-application';
import {ContainerLoader} from '@tartjs/core/lib/common';
import CoreInit from '@tartjs/core/lib/init';
import FilesystemInit from '@tartjs/filesystem/lib/init';
import EditorInit from '@tartjs/editor/lib/init';
import MonacoInit from '@tartjs/monaco/lib/init';
import WorkspaceInit from '@tartjs/workspace/lib/init';
import NavigatorInit from '@tartjs/navigator/lib/init';

let inited = false;

export interface ITartCoreProps {
  modules?: any[];
}

export function TartCore(props: ITartCoreProps) {
  const coreRef = useRef<HTMLDivElement>(undefined);
  const [containerLoader] = useState<ContainerLoader>(new ContainerLoader());

  useEffect(() => {
    const m = !!props.modules ? props.modules : [];
    if (!inited) {
      inited = true;
      const modules = [
        ...m,
        CoreInit.init(),
        FilesystemInit.init(),
        EditorInit.init(),
        MonacoInit.init(),
        WorkspaceInit.init(),
        NavigatorInit.init()
      ];
      containerLoader.loadsAsync(modules).then(() => {
      }).then(() => {
        containerLoader.getService<FrontendApplication>(FrontendApplication).start({host: coreRef.current});
      });
    }
  }, props.modules);

  return <div className={'tart-core'} ref={coreRef}>
  </div>;
}
