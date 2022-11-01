import './styles/main.less';
import 'reflect-metadata';

import React from 'react';
import {App} from './app';
import {createRoot} from 'react-dom/client';

const hostRoot = createRoot(document.getElementById('root') as HTMLElement);

hostRoot.render(
  <React.StrictMode>
    <App/>
  </React.StrictMode>
);
