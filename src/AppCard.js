import React, { Component } from 'react';
import noicon from './img/noicon.png';
import './MainDisplay.css';
import ToolTip from 'react-portal-tooltip';
import { getFirstPixelFromImage, platformIcons } from './Utils';

class AppCard extends Component {
  constructor(props) {
    super();
    this.props = props;
  }
  state = {
  isTooltipActive: false
  }

  showTooltip() {
    this.setState({isTooltipActive: true})
  }
  hideTooltip() {
    this.setState({isTooltipActive: false})
  }

  render() {
    const { name, title, version, author, repo, platform, description, url } = this.props;

    const cardClass = `AppCard  AppCard_${platform}`;

    let titleStripped = title.replace(/\W/g, '');

    let conCat = "ttid";

    let titleid = conCat.concat(titleStripped);

    let mba = () => {
      window.location.href = (`../search/${author}`);
    }

    const cardKey = `icon-${name}-${version}-${platform}`;
    return (
      <div className={cardClass} id={`${titleid}`}>
        <div className={`icon_wrapper ${cardKey}`}>
          <img    
            alt="icon"
            src={`${repo}/packages/${name}/icon.png`}
            onLoad={e => {
              let iconWrapper = document.getElementsByClassName(cardKey)[0];
              iconWrapper.style.backgroundColor = getFirstPixelFromImage(e.target);
            }}
            onError={e => { e.target.onerror = null; e.target.src = noicon }}
          />
        </div>
        <img id="console" alt={platform} src={`${platformIcons[platform]}`} />
        <div className="left">
          <div>v{version}</div>
        </div>
        <div className="cardright"  onMouseEnter={this.showTooltip.bind(this)} onMouseLeave={this.hideTooltip.bind(this)}>
          <div className="AppCard__Title">{title}</div>
          <div>{author}</div>

          <ToolTip active={this.state.isTooltipActive} position="bottom" arrow=" center" parent={`#${titleid}`}>
           <div className="tooltip">
            <a href={`/${platform}/${name}`}>
            </a>
            <a href={`/${platform}/${name}`}>
                  
                </a>
            <div className="tootipWidth"><b>{ description }</b></div>
              <div className="tooltipButtons">
                <button onClick={() => window.open(`${repo}/zips/${name}.zip`)}>Download</button>
                <button onClick={() => window.open(`${url}`)}>Source</button>
                <button onClick={ mba }>More by author</button>
                
              </div>
            </div>
          </ToolTip>

        </div>
      </div>
    );
  }
}

export default AppCard;
