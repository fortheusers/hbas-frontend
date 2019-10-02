import React, { Component } from 'react';
import {BrowserRouter, Switch, Route} from 'react-router-dom';
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
        <Switch>
          <Route path='/:platform/category/:category' component={Header}></Route>
          <Route path='/category/:category' component={Header}></Route>
          <Route path='/:platform/:package' component={Header}></Route>
          <Route path='/search' component={Header} />
          <Route path='/:platform' component={Header}></Route>
          <Route path='/' component={Header}></Route>
        </Switch>
        <div className="main">
          <Switch>
            <Route path='/:platform/category/:category' component={Sidebar} />

            <Route path='/search' component={Sidebar} />
            <Route path='/:platform/search' component={Sidebar} />

            <Route path='/category/:category' component={Sidebar} />

            <Route path='/:platform/:package' component={Sidebar} />
            <Route path='/:platform' component={Sidebar} />

            <Route path='/' component={Sidebar} />
          </Switch>
          <Switch>
            <Route path='/:platform/search/:query' component={AppList} />
            <Route path='/:platform/search' component={AppList} />
            <Route path='/search/:query' component={AppList} />
            <Route path='/search' component={AppList} />

            <Route path='/:platform/category/:category' component={AppList} />
            <Route path='/category/:category' component={AppList} />

            <Route path='/:platform/:package' component={AppDetails} />
            <Route path='/:platform' component={AppList} />

            <Route path='/' component={AppList} />
          </Switch>
        </div>
        <Footer />
      </BrowserRouter>);
  }
}

export default MainDisplay;
