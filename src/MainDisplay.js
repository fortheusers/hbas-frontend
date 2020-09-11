import React, { Component } from 'react';
import {BrowserRouter, Switch, Route} from 'react-router-dom';
import AppList from './AppList';
import AppDetails from './AppDetails';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import AppStatsChart from './AppStatsChart';
import './MainDisplay.css';

class MainDisplay extends Component {
  state = {
    hasError: false
  }

  render() {
    if (this.state.hasError) {
      return <h2 style={{padding: 10}}>
        An error occurred, please check the console for details
      </h2>;
    }

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

            <Route path='/stats' component={Sidebar} />
            <Route path='/:platform/stats' component={Sidebar} />

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

            <Route path='/:platform/stats' component={AppStatsChart} />
            <Route path='/stats' component={AppStatsChart} />

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

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.log(error);
    console.log(errorInfo);
  }
}

export default MainDisplay;
