import React from 'react';
import ReactDOM from 'react-dom/client';
import Landing from './pages/landing';

// temporary test
import addMyData from "./firebase/dbTest";
import readMyData from "./firebase/dbTest2";
addMyData();
readMyData();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Landing />

  </React.StrictMode>
);