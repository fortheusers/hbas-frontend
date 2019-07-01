import React, { Component } from 'react';
import loading from './loader.gif';
import AppList from './AppList';
import './MainDisplay.css';

const APP_MAGIC = "/app/";

// get current package name out of URL
const path = window.location.pathname.toLowerCase();
let selected = path.startsWith(APP_MAGIC) ? 
  path.substring(APP_MAGIC.length) : "dummy";

class AppDetails extends Component {
  state = {
    pkg: {}
  }

  constructor(props) {
    super(props);
    this.pkg = {};
    this.curPkg = selected;
  }

  async componentDidMount() {

    const packages = await AppList.fetchPackages();
    this.pkg = packages.find(pkg => pkg.name.toLowerCase() === this.curPkg);

    this.setState({
      pkg: this.pkg
    });
  }

  render() {
    const { pkg: { repo, name, title, description, details, author, version } } = this.state;

    if (!repo || !name) {
      return <img src={loading} alt="Loading" />
    }

    return (
      <div className="AppDetails">
        <img src={`${repo}/packages/${name}/screen.png`} alt="banner" />
        { title }
        { author } 
        { description }
        { version }
        <p>
          { details }
        </p>
      </div>
    );
  }
}

export default AppDetails;
