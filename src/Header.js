import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTwitter, faDiscord } from '@fortawesome/free-brands-svg-icons'
import { faCube, faPlus, faServer, faSignInAlt } from '@fortawesome/free-solid-svg-icons'
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
    const plat = repo === "all" ? "" : repo;
    const platSlash = plat === "" ? `` : `${plat}/`;
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
    return (
      <div className="nav">
        <ul>
          <li id="title" className="title">
            {/* <FontAwesomeIcon icon={faCube} /> */}
            <img id="store_icon" src={icon} alt="AppStore Logo" style={{ width: 16 }} />
            <span id="hbastitle">&nbsp;&nbsp;Homebrew App Store</span>
            <span id="hbasmtitle">&nbsp;&nbsp;HB App Store</span>
            <span className="platform"> for </span>
            <select id="device" defaultValue={this.platform} onChange={this.sub}
                    style={{backgroundImage: `url(${platformIcons[this.platform]})`}}>
              <option value="switch">Switch</option>
              <option value="wiiu">Wii U</option>
              <option value="3ds">3DS</option>
              <option value="all">All Consoles&nbsp;&nbsp;</option>
            </select>
          </li>
          <li id="ftu"><a href="https://fortheusers.org">About</a></li>
          <li id="discord"><a href="https://discord.gg/F2PKpEj">Discord</a></li>
          <li id="twitter"><a href="https://twitter.com/wiiubru">Twitter</a></li>
          <li id="account"><a href="https://opencollective.com/fortheusers">Donate</a></li>
          <li id="dns"><a href="https://github.com/fortheusers/libget/wiki/Overview-&-Glossary#repos">API</a></li>
          <li id="submit"><a href="https://submit.fortheusers.org/">Submit</a></li>
          <li id="m_ftu"><a href="https://fortheusers.org"><FontAwesomeIcon icon={faCube} /></a></li>
          <li id="m_discord"><a href="https://discord.gg/F2PKpEj"><FontAwesomeIcon icon={faDiscord} /></a></li>
          <li id="m_twitter"><a href="https://twitter.com/wiiubru"><FontAwesomeIcon icon={faTwitter} /></a></li>
          <li id="m_account"><a href="https://opencollective.com/fortheusers"><FontAwesomeIcon icon={faSignInAlt} /></a></li>
          <li id="m_dns"><a href="https://github.com/fortheusers/libget/wiki/Overview-&-Glossary#repos"><FontAwesomeIcon icon={faServer} /></a></li>
          <li id="m_submit"><a href="https://submit.fortheusers.org/"><FontAwesomeIcon icon={faPlus} /></a></li>
        </ul>
      </div>
    );
  }
}

export default Header;
