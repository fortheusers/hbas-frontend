import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCube } from '@fortawesome/free-solid-svg-icons'
import './MainDisplay.css';

const platform = "Switch";

class Header extends Component {
  render() {
    return (
      <div className="nav">
        <ul>
          <li className="title"><FontAwesomeIcon icon={faCube}/>
          &nbsp;&nbsp;Homebrew App Store <span className="platform">for {platform}</span></li>
          <li><a href="https://fortheusers.org">About</a></li>
          <li><a href="https://discord.gg/F2PKpEj">Discord</a></li>
          <li><a href="https://twitter.com/wiiubru">Twitter</a></li>
          <li><a href="https://www.switchbru.com/account/">Account</a></li>
          <li><a href="https://www.switchbru.com/dns">DNS</a></li>
          <li><a href="https://submit.fortheusers.org/">Submit</a></li>
        </ul>
      </div>
    );
  }
}

export default Header;
