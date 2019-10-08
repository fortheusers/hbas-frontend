import React, { Component } from 'react';
import loading from './loader.gif';
import noscreen from './noscreen.png';
import AppList from './AppList';
import './MainDisplay.css';
import { getParams } from './Utils';

class AppDetails extends Component {
  state = {
    pkg: {}
  }

  constructor(props) {
    super(props);
    this.pkg = {};
    const { package: pkg } = getParams(props);
    this.curPkg = pkg;
  }

  async componentDidMount() {

    const packages = await AppList.fetchPackages();
    this.pkg = packages.find(pkg => pkg.name.toLowerCase() === this.curPkg);

    if (!this.pkg) return;

    const d = "details";
    this.pkg[d] = this.pkg[d] ? this.pkg[d].replace(/\\n/g, '\n') : this.pkg[d];
    this.pkg[d] = this.pkg[d] ? this.pkg[d].replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/ig, '<a href="$&" target="_blank">$&</a>') : this.pkg[d];

    const clog = "changelog";
    this.pkg[clog] = this.pkg[clog] ? this.pkg[clog].replace(/\\n/g, '\n') : this.pkg[clog];
    this.pkg[clog] = this.pkg[clog] ? this.pkg[clog].replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/ig, '<a href="$&" target="_blank">$&</a>') : this.pkg[clog];
    
    this.setState({
      pkg: this.pkg
    });
  }

  render()
  {
    console.log(this.pkg);
    if (!this.pkg || Object.keys(this.pkg).length === 0) {
      return (<div className="AppDetails">
        There's no package named "{this.curPkg}" for the selected repos.
      </div>);
    }

    const {
      pkg: {
        repo,
        name,
        title,
        description,
        details,
        changelog,
        author,
        version,
        web_dls,
        app_dls,
        extracted,
        filesize,
        license,
        updated,
        url
        } } = this.state;

    if (!repo || !name) {
      return (<div className="AppDetails">
        <img src={loading} alt="Loading" style={{width: 270, height: 130}} />
      </div>);
    }
    let mba = () => {
      window.location.href = (`./search/${author}`);
    }

    return (
      <div className="AppDetails">
        <div className="AppDetailsInner">
          <div>
            <div className="catTitle">
              { title } <span className="lesser">by { author }</span>
              <div className="right">
                <button>Leave Feedback</button>
                <button onClick={mba}>More by Author</button>
              </div>
            </div>
            <img className="banner" src={`${repo}/packages/${name}/screen.png`} alt="banner" onError={e => { e.target.onerror=null; e.target.src=noscreen} } />
          </div>
          <div className="right infoBox">
            <div className="row">
              <div>{ description }</div>
              <br />
              <div className="sideHeader">Additional Info</div>
              <div><span>Version</span> { version }</div>
              <div><span>Updated</span> { updated }</div>
              <div><span>Size</span> { filesize } KB</div>
              <div><span>Zip Size</span> { extracted } KB</div>
              <div><span>License</span> { license }</div>
              <br />
              <div className="sideHeader">Download Stats</div>
              <div><span>Web DLs</span> { web_dls }</div>
              <div><span>App DLs</span> { app_dls }</div>
            </div>
            <button onClick={() => window.open(`${repo}/zips/${name}.zip`)}>Download</button>
            <button onClick={() => window.open(`${url}`)}>Source</button>
          </div>
          <div className="left row">
          <p className="sideHeader">App Details</p>
              <div className="details" dangerouslySetInnerHTML={{ __html: details }}></div>
            <div className="changelog">
            <p className="sideHeader">Changelog</p>
            <p className="details" dangerouslySetInnerHTML={{ __html: changelog }}></p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default AppDetails;
