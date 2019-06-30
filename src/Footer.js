import React, { Component } from 'react';
import './MainDisplay.css';

class Footer extends Component {
  render() {
    return (
      <div className="Footer">
        <div className="left">
          <span className="copyleft">&copy;</span> GPLv3 License
        </div>
        <div className="right">
          ForTheUsers is not affiliated with Nintendo Co. Ltd
        </div>
      </div>
    );
  }
}

export default Footer;
