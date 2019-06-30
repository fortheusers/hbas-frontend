import React, { Component } from 'react';
import {BrowserRouter, Switch, Link, Route} from 'react-router-dom';
import AppList from './AppList';
import AppDetails from './AppDetails';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import './MainDisplay.css';

class MainDisplay extends Component {
  render() {
    return (
      <BrowserRouter>
        <Header />
        <div className="main">
          <Sidebar />
          <Switch>
            <Route path='/apps/*' component={AppDetails} />
            <Route path='/apps' component={AppDetails} />
            <Route path='/search' component={AppList} />
            <Route path='/search/*' component={AppList} />
            <Route path='/' component={AppList} />
          </Switch>
        </div>
        <Footer />
      </BrowserRouter>);
  }
}

export default MainDisplay;
