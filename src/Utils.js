import React, { Component } from 'react';
import AdSense from 'react-adsense';
import wiiuIcon from './img/wiiu.png';
import switchIcon from './img/switch.png';
import bothIcon from './img/both.png';

const getParams = props => {
  const { match: { params: content } } = props;

  // return inner url params, but also lowercase all values
  return Object.keys(content)
  .reduce((destination, key) => {
    destination[key] = (content[key] || "").toLowerCase();
    return destination;
  }, {});
};

const platformIcons = {
  wiiu: wiiuIcon,
  switch: switchIcon,
  both: bothIcon
}

class FullWidthAd extends Component {
  ads = [
    {
      adClient: "ca-pub-7623664678937879",
      adSlot: "6161516658"
    },
    {
      adClient: "ca-pub-8148658375496745",
      adSlot: "4266492119"
    }
  ]

  constructor(props) {
    super();

    // get random ad info from a list of ad id peeps
    this.state = {
      ad: this.ads[Math.floor(Math.random() * this.ads.length)]
    };
  }
  render() {
    const { ad: { adClient, adSlot } } = this.state;

    return <div className="Ad">
      <AdSense.Google
        client={adClient}
        slot={adSlot}
        style={{ display: 'block', height: 70 }}
        format='fluid'
        responsive='true'
      />
    </div>;
  }
}

class Spacer extends Component {
  render() {
    return <div style={{height: 400}}>
      &nbsp;
    </div>;
  }
}

export { getParams, platformIcons, FullWidthAd, Spacer };
