import React, { Fragment, Component } from 'react';
import loading from './img/loader.gif';
import AppList from './AppList';
import noscreen from './img/noscreen.png';
import './MainDisplay.css';
import { getParams, FullWidthAd, Spacer, Mobile, getFirstPixelFromImage } from './Utils';
import Modal from 'react-responsive-modal';

class AppDetails extends Component {
  state = {
    pkg: {},
    loading: true,
    open: ''
  }

  constructor(props) {
    super(props);
    this.pkg = {};
    window.counter = 0;
    const { package: pkg, platform } = getParams(props);
    this.curPkg = pkg;

    this.state = { ...this.state, platform };
  }

  async componentDidMount() {

    const packages = await AppList.fetchPackages();
    this.pkg = packages.find(pkg => pkg.name.toLowerCase() === this.curPkg && pkg.platform === this.state.platform);

    if (!this.pkg) return this.setState({ loading: false });

    const d = "details";
    this.pkg[d] = this.pkg[d] ? this.pkg[d].replace(/\\n/g, '\n') : this.pkg[d];
    this.pkg[d] = this.pkg[d] ? this.pkg[d].replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/ig, '<a href="$&" target="_blank">$&</a>') : this.pkg[d];

    const clog = "changelog";
    this.pkg[clog] = this.pkg[clog] ? this.pkg[clog].replace(/\\n/g, '\n') : this.pkg[clog];
    this.pkg[clog] = this.pkg[clog] ? this.pkg[clog].replace(/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/ig, '<a href="$&" target="_blank">$&</a>') : this.pkg[clog];

    this.setState({
      pkg: this.pkg,
      loading: false
    });
  }
  onOpenModal = (target) => {
    this.setState({ open: target});
  };

  onCloseModal = () => {
    this.setState({ open: '' });
  };

  render() {
    const { open } = this.state;
    if (this.state.loading) {
      return (<div className="AppDetails">
        <img src={loading} alt="Loading" style={{ width: 270, height: 130 }} />
      </div>);
    }

    if (!this.pkg || Object.keys(this.pkg).length === 0) {
      return (<div className="AppDetails">
        There is no package named "{this.curPkg}" for the selected repos.
      </div>);
    }

    const {
      pkg: {
        repo,
        platform,
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
        md5,
        url,
        screens
      } } = this.state;

    let mba = () => {
      window.location.href = (`../search/${author}`);
    }
    let lf = () => {
      window.location.href = (`mailto:fight@fortheusers.org?subject=[HBAS] Leaving feedback for ${name}`); // temp link
    }

    let ua = navigator.userAgent;
    let dlButton;

    if (ua.includes("Switch" || "WiiU")) {
      dlButton = (<button onClick={() => alert(`We are sorry but Downloads are not available on this device.\n\nYou must install our Homebrew app to download from our Repo.\n\nIf you require more info on this please join us on Discord.`)}>Download</button>);
    }
    else {
      dlButton = (<button onClick={() => window.open(`${repo}/zips/${name}.zip`)}>Download</button>
      );
    }

    const screenShotContainer = (<Fragment>
      <p className="sideHeader">Screen Shots</p>
      <div className="screen_container">
        { [...Array(screens).keys()].map(screenIdx => {
          const imgURL = `${repo}/packages/${name}/screen${screenIdx+1}.png`;
          return (<span>
              <img onClick={() => this.onOpenModal(imgURL)} className="screen_thumb" src={imgURL} alt="Screen shot" />
              <Modal open={open === imgURL} onClose={this.onCloseModal}>
                <img onClick={this.onCloseModal} className="modal_screen" src={imgURL} alt="Screen shot" />
              </Modal>
            </span>);         
        })}</div>
        </Fragment>);



    const bannerContainer = (
      // fallback to wider banner style (used by app)
      <div id="bannerWrapper">
        <img className="banner" crossorigin="anonymous" src={`${repo}/packages/${name}/screen.png`} alt="banner"
        onError={e => {
          const img = e.target;
          img.style.margin = "0 auto";
          img.style.display = "block";
          img.crossOrigin = "anonymous";
          img.src = (window.counter > 0) ? noscreen : `${repo}/packages/${name}/icon.png`;
          window.counter ++;
        }}
        onLoad={e => {
          document.getElementById("bannerWrapper").style.backgroundColor = getFirstPixelFromImage(e.target);
        }} />
      </div>
    );

    return (
      <div className="AppDetails">
        <Mobile />
        <div className="AppDetailsInner">
          <div className="catTitle">
            {title} <span className="lesser">by {author}</span>
            <div className="right">
              <button id="feedback" onClick={lf}>Leave Feedback</button>
              <button id="full" onClick={mba}>More by Author</button>
            </div>
          </div>
          <div className="overlay">
            { bannerContainer }
            <img id="console" alt={platform} src={`${repo}/packages/logo.png`} />
          </div>
          <div className="right infoBox">
            <div className="row">
              <div>{description}</div>
              <br />
              <div className="sideHeader">Additional Info</div>
              <div><span>Version</span> {version}</div>
              <div><span>Updated</span> {updated}</div>
              <div><span>Size</span> {extracted} KB</div>
              <div><span>Zip Size</span> {filesize} KB</div>
              <div><span>License</span> {license}</div>
              <br />
              <div className="sideHeader">Download Stats</div>
              <div><span>Web DLs</span> {web_dls}</div>
              <div><span>App DLs</span> {app_dls}</div>
              <div><span>md5</span><input className="md5text" defaultValue={md5} type="text"></input></div>
            </div>
            { dlButton }
            <button onClick={() => window.open(`${url}`)}>Source</button>
            <button id="mobileonly" onClick={mba}>More by Author</button>
          </div>
          <div className="left row">
            <p className="sideHeader">App Details</p>
            <div className="details" dangerouslySetInnerHTML={{ __html: details }}></div>
            { screens > 0 && screenShotContainer }
            { changelog !== "n/a" && (<div className="changelog">
              <p className="sideHeader">Changelog</p>
              <p className="details" dangerouslySetInnerHTML={{ __html: changelog }}></p>
            </div>) }
          </div>
        </div>
        <FullWidthAd />
        <Spacer />
      </div>
    );
  }
}

export default AppDetails;
