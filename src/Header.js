import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCube } from '@fortawesome/free-solid-svg-icons'
import './MainDisplay.css';

const platform = "Switch";

class Header extends Component {
  render() {
    return (
      <div className="Header">
        <div className="left">
          <span className="title">
            <FontAwesomeIcon icon={faCube} />
            Homebrew App Store</span> for {platform}
        </div>
        <div className="right">
          <a href="https://fortheusers.org">Aboot</a>
          <a href="https://discord.gg/F2PKpEj">Discord</a>
          <a href="https://twitter.com/wiiubru">Twitter</a>
          <a href="https://www.switchbru.com/account/">Account</a>
          <a href="https://www.switchbru.com/dns">DNS</a>
          <a href="https://submit.fortheusers.org/">Submit</a>
        </div>
      </div>
    );
  }
}

export default Header;
