import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBriefcase, faSearch, faThLarge, faPlay, faGamepad, faCog, faPuzzlePiece, faSwatchbook, faFastForward, faCubes, faChartArea, faCoffee } from '@fortawesome/free-solid-svg-icons'
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
    short: "_stats",
    name: "Statistics",
    icon: faChartArea,
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
  },
  {
    short: "aroma",
    name: "Aroma-Ready",
    icon: faCoffee
  },
  // {
  //   short: "_courses",
  //   name: "Courses",
  //   icon: faRobot
  // },
  {
    short: "_misc",
    name: "Misc",
    icon: faCubes
  }, {
    short: "_quickstore",
    name: "QuickStore",
    icon: faFastForward
  },
  {
    short: "legacy",
    name: "Legacy",
    icon: faBriefcase
  },
];

let selected = "_all";
let choice = "_all";

class Sidebar extends Component {
  constructor(props) {
    super();

    const params = getParams(props);

    const { category, package: pkg } = params;
    let { platform } = params;

    // if we have local storage, and we _DO_ have a package, (aka _not_ on a listing page) respect local storage platform over the URL!
    if (pkg && window.localStorage.getItem("platform")) {
      platform = window.localStorage.getItem("platform");
    }

    // check if our category from the URL is valid, else default to all
    const valid = categories.find(cat => cat.name.toLowerCase() === category || cat.short === category)
    selected = valid ? valid : categories[1];
    choice = selected;

    if (
      window.location.pathname.endsWith("/search")
      || window.location.pathname.endsWith("/stats")
      || window.location.pathname.endsWith("/quickstore")
    ) {
      const splitPart = window.location.pathname.split("/").pop();
      choice = categories.find(cat => cat.short.substring(1) === splitPart);
    }

    this.platform = platform;
  }

  static getCurrentCategory() {
    return selected;
  }

  static getAllCategories() {
    return categories;
  }

  render() {
    const platInfo = (this.platform && this.platform !== "all") ? `/${this.platform}` : "";
    
    return (
      <div className={`Sidebar ${this.platform}_only`}>
        {
          categories.map(cat => {
            let target = cat.short !== "_all" ? `${platInfo}/category/${cat.name.toLowerCase()}` : `${platInfo || "/"}`;
            target = (cat.short === "_search" || cat.short === "_stats" || cat.short === "_quickstore") ? `${platInfo}/${cat.short.substring(1)}` : target;

            console.log(target);
            return (<a
                href={target}
                key={target}
                className={`sidebar-item${choice.short === cat.short ? " selected" : ""}`}
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