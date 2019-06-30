import React, { Component } from 'react';
import logo from './logo.svg';
import Sidebar from './Sidebar';
import AppDetails from './AppDetails';
import './MainDisplay.css';

class App extends Component {
  render() {
    return (
      <div>
        <Sidebar />
        <AppDetails />
      </div>
    );
  }
}

export default App;
