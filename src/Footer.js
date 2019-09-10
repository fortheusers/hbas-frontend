import React, { Component } from 'react';
import './MainDisplay.css';

class Footer extends Component {
  render() {
    return (
      <div className="Footer">
        <div className="left">
          <a className="copyright" href="https://gitlab.com/4TU/hbas-frontend/blob/master/LICENSE">
            <span className="copyleft">&copy;</span> GPLv3 License</a>
        </div>
        <div className="right">
          <a className="copyright" href="https://fortheusers.org/">ForTheUsers </a>
           is not affiliated with <a className="copyright" href="https://en.wikipedia.org/wiki/Nintendo"> Nintendo Co. Ltd</a>
        </div>
      </div>
    );
  }
}

export default Footer;
