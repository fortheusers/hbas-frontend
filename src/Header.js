import React, { Component } from 'react';
import './MainDisplay.css';

class Header extends Component {
  render() {
    return (
      <div className="Header">
        <div className="left">
          Homebrew App Store
        </div>
        <div clssName="right">
          <a href="https://fortheusers.org">About</a>
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
