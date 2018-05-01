import React from 'react';
import ReactDOM from 'react-dom';
import Extension from './Extension';

const injectWrapper = document.body;
const app = document.createElement('div');
app.id = 'jk--chrome--extension';
if (injectWrapper) injectWrapper.prepend(app);

ReactDOM.render(<Extension />, document.getElementById('jk--chrome--extension'));
