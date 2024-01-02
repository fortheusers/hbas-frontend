import React, { Fragment, Component } from 'react';
import loading from './img/loader.gif';
import AppList from './AppList';
import noscreen from './img/noscreen.png';
import './MainDisplay.css';
import { getParams, Spacer, Mobile, getFirstPixelFromImage, platformIcons } from './Utils';
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

    const packages = await AppList.fetchPackages(this.state.platform);
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
    this.setState({ open: target });
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
        details = "",
        changelog,
        author,
        version,
        app_dls,
        extracted,
        filesize,
        license,
        updated,
        md5,
        url,
        screens,
        readMoreExpanded = false,
        changelogExpanded = false,
        isShowingInstalledFiles = false,
        installedFiles = ""
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
      dlButton = (<a target="_blank" rel="noopener noreferrer" href={`${repo}/zips/${name}.zip`}>Download</a>
      );
    }

    const screenShotContainer = (<Fragment>
      <p className="sideHeader">Screen Shots</p>
      <div className="screen_container">
        {[...Array(screens).keys()].map(screenIdx => {
          const imgURL = `${repo}/packages/${name}/screen${screenIdx + 1}.png`;
          return (<span>
            <img onClick={() => this.onOpenModal(imgURL)} className="screen_thumb" src={imgURL} alt="Screen shot" />
            <Modal open={open === imgURL} onClose={this.onCloseModal}>
              <img onClick={this.onCloseModal} className="modal_screen" src={imgURL} alt="Screen shot" />
            </Modal>
          </span>);
        })}</div>
    </Fragment>);

    const readMoreContainer = (
      <button
        className="readMore"
        onClick={() => this.setState({
          pkg: { ...this.state.pkg, readMoreExpanded: true }
        })}>
        Show More Details
      </button>
    );

    const changeLogMoreContainer = (
      <button
        className="readMore2"
        onClick={() => this.setState({
          pkg: { ...this.state.pkg, changelogExpanded: true }
        })}>
        Show Full Changelog
      </button>
    );

    const showFilesButton = (
      <button onClick={async () => {
        // pull the installed files list from manifest
        const manifest_url = `${repo}/packages/${name}/manifest.install`;
        const results = await fetch(manifest_url);
        const manifestData = (await results.text()).replaceAll("\n", "<br />");
        this.setState({
          pkg: {
            ...this.state.pkg,
            isShowingInstalledFiles: true,
          installedFiles: manifestData
          }
        });
      }}>
        Show Installed Files List
      </button>
    );

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
            window.counter++;
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
            {bannerContainer}
            <img id="console" alt={platform} src={`${platformIcons[platform]}`} />
          </div>
          <div className={`right infoBox ${platform}_only`}>
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
              <div><span>Count</span> {app_dls}</div>
              <div><span>md5</span><input className="md5text" defaultValue={md5} type="text" readonly></input></div>
            </div>
            {dlButton}
            <a target="_blank" rel="noopener noreferrer" href={`${url}`}>Source</a>
            <a target="_blank" rel="noopener noreferrer" href={`/stats?apps=${platform}/${name.toLowerCase()}`}>View Stats</a>
            <button id="mobileonly" onClick={mba}>More by Author</button>
          </div>
          <div className="left row">
            <p className="sideHeader">App Details</p>
            <div className="details" dangerouslySetInnerHTML={{ __html: (readMoreExpanded || details.length < 250) ? details : (details.substring(0, 250) + "...") }}></div>
            {!readMoreExpanded && details.length >= 250 && readMoreContainer}
            {screens > 0 && screenShotContainer}
            {changelog !== "n/a" && (<div className="changelog">
              <p className="sideHeader">Changelog</p>
              <p className="details" dangerouslySetInnerHTML={{ __html: (changelogExpanded || changelog.length < 250) ? changelog : (changelog.substring(0, 250) + "...") }}></p>
              {!changelogExpanded && changelog.length >= 250 && changeLogMoreContainer}
            </div>)}
            <div className="filesArea">
              { isShowingInstalledFiles ? (
                <Fragment>
                <p className="sideHeader">Installed Files List</p>
                  <p className="installedFiles" dangerouslySetInnerHTML={{ __html: installedFiles }}></p>
                </Fragment>
                ): showFilesButton }
            </div>
            <Spacer />
          </div>
        </div>
        {/* <FullWidthAd /> */}
      </div>
    );
  }
}

export default AppDetails;
