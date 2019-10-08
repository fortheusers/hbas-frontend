import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTwitter, faDiscord } from '@fortawesome/free-brands-svg-icons'
import { faCube, faPlus, faServer, faSignInAlt, faBars } from '@fortawesome/free-solid-svg-icons'
import './MainDisplay.css';
import { getParams } from './Utils';

class Header extends Component {
  constructor(props) {
    super();
    this.platform = window.localStorage.getItem("platform") || "both";

    const { platform, package: pkg } = getParams(props);

    // if we don't have a package, (on a listing page) defer to the URL to get platform
    if (!pkg) {
      this.platform = platform || "both";
    }
  }
  
  sub = (event) => {
    let repo = event.target.value;
    window.localStorage.setItem("platform", repo);
    window.location.href = (repo && repo !== "both") ? `/${repo}` : '/';
  }

  render() {
    return (
      <div className="nav">
        <ul>
          <li id="title" className="title"><FontAwesomeIcon icon={faCube} />
            &nbsp;&nbsp;Homebrew App Store <span className="platform">for </span>
            <select id="device" defaultValue={this.platform} onChange={this.sub}>
              <option id="swit" value="switch">Switch</option>
              <option id="wii" value="wiiu">Wii U</option>
              <option id ="switwii" value="both">Switch &amp; Wii U</option>
            </select>
          </li>
          <li id="ftu"><a href="https://fortheusers.org">About</a></li>
          <li id="discord"><a href="https://discord.gg/F2PKpEj">Discord</a></li>
          <li id="twitter"><a href="https://twitter.com/wiiubru">Twitter</a></li>
          <li id="account"><a href="https://www.switchbru.com/account/">Account</a></li>
          <li id="dns"><a href="https://www.switchbru.com/dns">DNS</a></li>
          <li id="submit"><a href="https://submit.fortheusers.org/">Submit</a></li>
          <li id="m_ftu"><a href="https://fortheusers.org"><FontAwesomeIcon icon={faCube} /></a></li>
          <li id="m_discord"><a href="https://discord.gg/F2PKpEj"><FontAwesomeIcon icon={faDiscord} /></a></li>
          <li id="m_twitter"><a href="https://twitter.com/wiiubru"><FontAwesomeIcon icon={faTwitter} /></a></li>
          <li id="m_account"><a href="https://www.switchbru.com/account/"><FontAwesomeIcon icon={faSignInAlt} /></a></li>
          <li id="m_dns"><a href="https://www.switchbru.com/dns"><FontAwesomeIcon icon={faServer} /></a></li>
          <li id="m_submit"><a href="https://submit.fortheusers.org/"><FontAwesomeIcon icon={faPlus} /></a></li>
          <li id="m_menu"><button><FontAwesomeIcon id="bars" icon={faBars} /></button></li>
        </ul>
      </div>
    );
  }
}

export default Header;
