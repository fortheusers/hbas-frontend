import React, { Component } from 'react';
import './MainDisplay.css';

class AppCard extends Component {
  constructor(props) {
    super();
    this.props = props;
  }

  render() {
    const { name, title, version, author, repo, description } = this.props;

    return (
      <div className="AppCard">
        <img alt="icon" src={`${repo}/packages/${name}/icon.png`} />
        <div>{ title }</div>
        <div>{ version }</div>
        <div>{ author }</div>
        <div>{ description }</div>
      </div>
    );
  }
}

export default AppCard;
