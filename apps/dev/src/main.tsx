import './styles/main.less';
import 'reflect-metadata';

import React from 'react';
import ReactDOM from 'react-dom';
import {App} from './app';

ReactDOM.render(
    <React.StrictMode>
      <App/>
    </React.StrictMode>,
    document.getElementById('root') as HTMLElement
);
