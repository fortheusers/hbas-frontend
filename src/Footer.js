import React, { Component } from 'react';
import {init_theme, toggle_theme} from './Utils';
import './MainDisplay.css';

class Footer extends Component {
  // on mount, set the theme
  componentDidMount() {
    init_theme();
  }

  render() {
    return (
      <div className="Footer">
        <div className="left">
          <a className="copyright" href="https://gitlab.com/4TU/hbas-frontend/blob/master/LICENSE">
            <span className="copyleft">&copy;</span> GPLv3 License</a>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a className="copyright" href="/dmca-request">DMCA Form</a>
        </div>
        <div className="right">
          <button style={{fontSize: 10, padding: 4, marginRight: 15, verticalAlign: "top"}} onClick={toggle_theme}>
            Change Theme
          </button>
          <a className="copyright" href="https://fortheusers.org/">ForTheUsers </a>
           is not affiliated with <a className="copyright" href="https://en.wikipedia.org/wiki/Nintendo"> Nintendo Co. Ltd</a>
        </div>
      </div>
    );
  }
}

export default Footer;
