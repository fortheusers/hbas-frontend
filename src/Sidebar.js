import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faThLarge, faPlay, faGamepad, faCog, faPuzzlePiece, faSwatchbook, faRobot, faCubes, faLightbulb } from '@fortawesome/free-solid-svg-icons'
import { getParams } from './Utils';
import './MainDisplay';

const categories = [
  {
    short: "_search",
    name: "Search",
    icon: faSearch
  }, {
    short: "_all",
    name: "All Apps",
    icon: faThLarge
  }, {
    short: "game",
    name: "Games",
    icon: faPlay
  }, {
    short: "emu",
    name: "Emulators",
    icon: faGamepad
  }, {
    short: "tool",
    name: "Tools",
    icon: faCog
  }, {
    short: "advanced",
    name: "Advanced",
    icon: faPuzzlePiece
  }, {
    short: "theme",
    name: "Themes",
    icon: faSwatchbook
  }, {
    short: "concept",
    name: "Concepts",
    icon: faLightbulb
  }, {
    short: "_courses",
    name: "Courses",
    icon: faRobot
  }, {
    short: "_misc",
    name: "Misc",
    icon: faCubes
  },
];

let selected = "_all";

class Sidebar extends Component {
  constructor(props) {
    super();

    const params = getParams(props);

    const { category, package: pkg } = params;
    let { platform } = params;

    console.log(params);

    // if we have local storage, and we _DO_ have a package, (aka _not_ on a listing page) respect local storage platform over the URL!
    if (pkg && window.localStorage.getItem("platform")) {
      platform = window.localStorage.getItem("platform");
    }

    // check if our category from the URL is valid, else default to all
    const valid = categories.find(cat => cat.name.toLowerCase() === category || cat.short === category)
    selected = valid ? valid : categories[1];

    this.platform = platform;
  }

  static getCurrentCategory() {
    return selected;
  }

  static getAllCategories() {
    return categories;
  }

  render() {
    console.log(platInfo);
    const platInfo = (this.platform && this.platform !== "both") ? `/${this.platform}` : "";
    return (
      <div className="Sidebar">
        {
          categories.map(cat => {
            let target = cat.short !== "_all" ? `${platInfo}/category/${cat.name.toLowerCase()}` : `${platInfo || "/"}`;
            target = cat.short === "_search" ? `${platInfo}/search` : target;

            console.log(target);
            return (<a
                href={target}
                key={target}
              >
                <div className="icon">
                  <FontAwesomeIcon icon={cat.icon} />
                </div>
                <span className="text">
                  {cat.name || "All Apps"}
                </span>
              </a>);
          })
        }
      </div>
    );
  }
}

export default Sidebar;