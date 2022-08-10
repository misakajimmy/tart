import React, {useEffect, useRef, useState} from 'react';
import {FrontendApplication} from '@tart/core/lib/browser/frontend-application';
import {ContainerLoader} from '@tart/core/lib/common';
import CoreInit from '@tart/core/lib/init';
import FilesystemInit from '@tart/filesystem/lib/init';
import EditorInit from '@tart/editor/lib/init';
import MonacoInit from '@tart/monaco/lib/init';
import WorkspaceInit from '@tart/workspace/lib/init';
import NavigatorInit from '@tart/navigator/lib/init';

let inited = false;

export interface ITartCoreProps {
  modules?: [];
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
        NavigatorInit.init(),
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
