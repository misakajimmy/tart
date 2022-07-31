import 'reflect-metadata';
import {Container, injectable} from 'inversify';
import React, {useEffect, useRef} from 'react';

export function TartCore() {
  const coreRef = useRef<HTMLDivElement>(undefined);

  useEffect(()=>{
  },[
    coreRef
  ]);

  return <div className={'tart-core'} ref={coreRef}>
    tart core
  </div>;
}
