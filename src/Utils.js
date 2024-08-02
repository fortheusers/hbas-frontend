import React, { Component } from 'react';
import AdSense from 'react-adsense';
import wiiuIcon from './img/wiiu.png';
import switchIcon from './img/switch.png';
import threedsIcon from './img/3ds.png';
import allIcon from './img/all.png';

const getParams = props => {
  const { match: { params: content } } = props;

  // return inner url params, but also lowercase all values
  return Object.keys(content)
    .reduce((destination, key) => {
      destination[key] = (content[key] || "").toLowerCase();
      return destination;
    }, {});
};

const stringDateToTimestamp = incoming => {
  if (!incoming) return 0;
  const parts = incoming.split('/');
  const [day, month, year] = parts;
  return new Date(year, month - 1, day);
}

const platformIcons = {
  wiiu: wiiuIcon,
  switch: switchIcon,
  '3ds': threedsIcon,
  all: allIcon
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
    return <div style={{
      height: 400,
      width: 20
    }}>
      &nbsp;
    </div>;
  }
}

class Mobile extends Component {

  selectedcat = (event) => {
    /* Hacky get platform method */
    let e = document.getElementById("device");
    let repo = e.options[e.selectedIndex].value;
    let catselect = event.target.value;
    if (repo === "all") {
      window.location.href = (`${catselect}`);
    }
    else {
      window.location.href = (`/${repo}${catselect}`);
    }
  }

  choice = (event) => {
    let path = event.target.value;
    window.location.href = (path);
  }
  render() {
    return <div className="mobile">
      <div className="categories">
        {/* TODO: dynamically load from category list */}
        <select className="menuselect" defaultValue="#" onChange={this.selectedcat}>
          <option selected disabled hidden value="#">Categories</option>
          <option value="/search">Search</option>
          <option value="/">All apps</option>
          <option value="/stats">Statistics</option>
          <option value="/category/games">Games</option>
          <option value="/category/emulators">Emulators</option>
          <option value="/category/tools">Tools</option>
          <option value="/category/advanced">Advanced</option>
          <option value="/category/themes">Themes</option>
          <option value="/quickstore">QuickStore</option>
          <option value="/category/legacy">Legacy</option>
        </select>
      </div>
      <div className="links">
        <select className="menuselect" id="menu" defaultValue="#" onChange={this.choice}>
          <option selected disabled hidden value="#">Menu</option>
          <option value="/about">About</option>
          <option value="https://discord.gg/F2PKpEj">Discord</option>
          <option value="/api-info">API</option>
          <option value="/submit-or-request">Submit</option>
          <option value="/request-takedown">Request Takedown</option>
        </select>
      </div>
    </div>
  }
}

const getFirstPixelFromImage = (img) => {
  img.crossOrigin = "anonymous";
  var canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const context = canvas.getContext('2d');
  context.drawImage(img, 0, 0, img.width, img.height);
  const buf8 = context.getImageData(1, 1, 1, 1).data;
  var data = new Uint32Array(buf8);

  // if the pixel is transparent, return white
  if ((data[3] || 0) === 0) {
    return 'rgb(255, 255, 255)';
  }

  return `rgb(${data[0]}, ${data[1]}, ${data[2]})`;
}

export { getParams, getFirstPixelFromImage, stringDateToTimestamp, platformIcons, FullWidthAd, Spacer, Mobile };


/*
  JS file for managing light / dark themes
  The toggle_theme(); function toggles the saved theme and updates the screen accordingly
  The remove_theme(); function removes the theme from localstorage and only updates the screen if it doesn't match the system settings
  The window.matchMedia(); function call watches for updates to system settings to keep localstorage settings accurate
*/
// from https://stackoverflow.com/a/76795904/4953343

function get_system_theme() {
  /*
      Function for getting the system color scheme
  */

  window.theme = "dark";
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)") && window.matchMedia("(prefers-color-scheme: light)").matches) {
    window.theme = "light";
  }

  return window.theme;
}

function toggle_saved_theme() {
  /*
      Function for toggling between the two themes saved to local storage
      Returns:
          Value stored in local storage
  */

  // Gets Current Value
  if (localStorage.getItem("theme")) {
      window.theme = localStorage.getItem("theme");
  }
  else {
      window.theme = get_system_theme();
  }

  // Sets the stored value as the opposite
  if (window.theme === "light") {
      localStorage.setItem("theme", "dark");
  }
  else {
      localStorage.setItem("theme", "light");
  }

  return localStorage.getItem("theme");
}

function switch_theme_rules() {
  /*
      Function for switching the rules for perfers-color-scheme
      Goes through each style sheet file, then each rule within each stylesheet
      and looks for any rules that require a prefered colorscheme, 
      if it finds one that requires light theme then it makes it require dark theme / vise
      versa. The idea is that it will feel as though the themes switched even if they haven't. 
  */

  for (var sheet_file = 0; sheet_file < document.styleSheets.length; sheet_file++) {
      try {
          for (var sheet_rule = 0; sheet_rule < document.styleSheets[sheet_file].cssRules.length; sheet_rule++) {
              let rule = document.styleSheets[sheet_file].cssRules[sheet_rule];

              if (rule && rule.media && rule.media.mediaText.includes("prefers-color-scheme")) {
                  let rule_media = rule.media.mediaText;
                  let new_rule_media = "";

                  if (rule_media.includes("light")) {
                      new_rule_media = rule_media.replace("light", "dark");
                  }
                  if (rule_media.includes("dark")) {
                      new_rule_media = rule_media.replace("dark", "light");
                  }
                  rule.media.deleteMedium(rule_media);
                  rule.media.appendMedium(new_rule_media);
              }
          }
      }
      catch (e) {
          let broken_sheet = document.styleSheets[sheet_file].href;
          console.warn(broken_sheet + " broke something with theme toggle : " + e);
      }
  }
}

export function toggle_theme() {
  /*
      Toggles the current theme used
  */
  toggle_saved_theme();
  switch_theme_rules();
}

export function remove_theme() {
  /*
      Function for removing theme from local storage
  */
  if (localStorage.getItem("theme")) {
      if (get_system_theme() !== localStorage.getItem("theme")) {
          switch_theme_rules();
      }
      localStorage.removeItem("theme");
  }
}

export function init_theme() {
  
  if (window.matchMedia) {

    window.matchMedia('(prefers-color-scheme: dark)')
      /*
          This makes it such that if a user changes the theme on their
          browser and they have a preferred theme, the page maintains its prefered theme. 
      */
      .addEventListener("change", event => {
          if (localStorage.getItem("theme")) {
              switch_theme_rules(); // Switches Theme every time the prefered color gets updated
          }
      }
    )
  }

  if (localStorage.getItem("theme")) {
    if (get_system_theme() !== localStorage.getItem("theme")) {
        switch_theme_rules();
    }
  }
}

export function getHumanSize(bytes) {
  // convert bytes to human readable size string
  const sizes = ['bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 bytes';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  const size = bytes / Math.pow(1024, i);
  // limit to 2 decimal places
  const formattedSize = parseFloat(size.toFixed(2));
  return formattedSize + ' ' + sizes[i];
}