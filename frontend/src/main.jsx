/*
 * Name: Tom Arbaugh
 * Date: 4/14/2026
 * Assignment: Final Project
 * Notes: Ear Trainer
 */
// Default import of React namespace for JSX runtime (classic transform uses React in scope).
import React from 'react';
// createRoot is the React 18 concurrent root API replacing ReactDOM.render.
import ReactDOM from 'react-dom/client';
// Provider injects Redux store into the React context tree for hooks access.
import { Provider } from 'react-redux';
// Configured Redux store instance combining scale, harmony, and guess slices.
import store from './store/store';
// Root UI component composing layout, tabs, and piano.
import App from './App';

// createRoot selects the DOM mount point and returns a concurrent root object.
ReactDOM.createRoot(document.getElementById('root')).render(
  // StrictMode double-invokes certain lifecycles in dev to surface side-effect bugs.
  <React.StrictMode>
    {/* Provider passes store so useDispatch/useSelector work in descendants. */}
    <Provider store={store}>
      {/* App is the entire Ear Trainer UI tree. */}
      <App />
    </Provider>
  </React.StrictMode>
);
