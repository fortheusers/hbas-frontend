import React, { Component, Fragment } from 'react';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
// import { faTwitter, faDiscord } from '@fortawesome/free-brands-svg-icons'
// import { faCube, faPlus, faServer, faSignInAlt } from '@fortawesome/free-solid-svg-icons'
import './MainDisplay.css';
import icon from './img/icon.png';
import { getParams, platformIcons } from './Utils';

class Header extends Component {
  constructor(props) {
    super();
    this.platform = window.localStorage.getItem("platform") || "all";

    const { platform, package: pkg } = getParams(props);

    // if we don't have a package, (on a listing page) defer to the URL to get platform
    if (!pkg) {
      this.platform = platform || "all";
    }
  }
  
  sub = (event) => {
    let repo = event.target.value;
    window.localStorage.setItem("platform", repo);
    const plat = repo === "all" ? "all" : repo;
    const platSlash = plat === "" ? `/all` : `${plat}/`;
    if (window.location.href.endsWith("/quickstore")) {
      window.location.href = `/${platSlash}quickstore`;
    }
    else if (window.location.href.endsWith("/search")) {
      window.location.href = `/${platSlash}search`;
    }
    else {
      window.location.href = `/${plat}`;
    }
  }

  render() {
    // hide the subtitle if we're on the home page, and we don't have a platform selected
    const hidePlatformSubtitle = (window.location.pathname === "" || window.location.pathname === "/");

    const platformName = hidePlatformSubtitle ? (<Fragment>
        <span className="platform"> by </span>
        <a id="title" href="https://fortheusers.org">ForTheUsers</a>
      </Fragment>) : (<Fragment>
      <span className="platform"> for </span>
      <select id="device" defaultValue={this.platform} onChange={this.sub}
        style={{backgroundImage: `url(${platformIcons[this.platform]})`}}>
          <option value="switch">Switch&nbsp;&nbsp;</option>
          <option value="wiiu">Wii U&nbsp;&nbsp;</option>
          <option value="all">Both&nbsp;&nbsp;</option>
          <option value="3ds">3DS&nbsp;&nbsp;</option>
      </select>
    </Fragment>);

    return (
      <div className="nav">
        <ul>
          <li id="title" className="title">
            {/* <FontAwesomeIcon icon={faCube} /> */}
            <a id="title" href="/">
              <img id="store_icon" src={icon} alt="AppStore Logo" style={{ width: 16 }} />
              <span id="hbastitle">&nbsp;&nbsp;Homebrew App Store</span>
            </a>
            {platformName}
          </li>

          {/* Desktop Links */}
          <li id="discord"><a href="https://discord.gg/F2PKpEj">Discord</a></li>
          <li id="account"><a href="https://github.com/fortheusers">Github</a></li>
          <li id="dns"><a href="/api-info">API</a></li>
          <li id="submit"><a href="/submit-or-request">Submit</a></li>
          <li id="ftu"><a href="/about">About</a></li>
        </ul>
      </div>
    );
  }
}

export default Header;
