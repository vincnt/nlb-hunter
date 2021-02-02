import React from 'react'
import firebase from '@firebase/app';

import './App.css';

import {Nlb} from './nlb'
require('firebase/functions')

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBDnt_mXdIWXiCsaG8gC3xrESvVuXoJpIk",
  authDomain: "sg-nlb.firebaseapp.com",
  projectId: "sg-nlb",
  storageBucket: "sg-nlb.appspot.com",
  messagingSenderId: "1057873065989",
  appId: "1:1057873065989:web:70eb88256f4947b33bc46c",
  measurementId: "G-1N566Q40TH"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const nodeEnv = process.env.NODE_ENV

if (nodeEnv === 'development'){
  firebase.functions().useEmulator("localhost", 5001);
}

function App() {

  return (
    <Nlb></Nlb>
  );
}

export default App;
