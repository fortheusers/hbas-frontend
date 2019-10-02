import React, { Component } from 'react';
import noicon from './noicon.png';
import './MainDisplay.css';

class AppCard extends Component {
  constructor(props) {
    super();
    this.props = props;
  }

  render() {
    const { name, title, version, author, repo, platform } = this.props;

    const cardClass = `AppCard ${platform === "wiiu" ? "wiiu" : ""}`;

    return (
      <div className={cardClass}>
        <img alt="icon" src={`${repo}/packages/${name}/icon.png`} onError={e => { e.target.onerror = null; e.target.src = noicon }} />

        <div className="left">
          <div>v. {version}</div>
        </div>
        <div className="cardright">
          <div className="AppCard__Title">{title}</div>
          {/* <div>{ description }</div> */}
          <div>{author}</div>
        </div>
      </div>
    );
  }
}

export default AppCard;
