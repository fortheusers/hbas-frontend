import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBriefcase, faSearch, faThLarge, faPlay, faGamepad, faCog, faPuzzlePiece, faSwatchbook, faFastForward, faCubes, faChartArea, faCoffee } from '@fortawesome/free-solid-svg-icons'
import { getParams } from './Utils';
import ToolTip from 'react-portal-tooltip';
import './MainDisplay';

const categories = [
  {
    short: "_search",
    name: "Search",
    icon: faSearch,
    hover: "  Search by App title or developer"
  }, {
    short: "_all",
    name: "All Apps",
    icon: faThLarge,
    hover: "All Apps"
  }, {
    short: "_stats",
    name: "Statistics",
    icon: faChartArea,
    hover: "  View and compare download stats"
  }, {
    short: "game",
    name: "Games",
    icon: faPlay,
    hover: "  Homebrew games and ports"
  }, {
    short: "emu",
    name: "Emulators",
    icon: faGamepad,
    hover: "  Games console emulators"
  }, {
    short: "tool",
    name: "Tools",
    icon: faCog,
    hover: "  Practical applications"
  }, {
    short: "advanced",
    name: "Advanced",
    icon: faPuzzlePiece,
    hover: "  System tools that usually require other apps to run"
  }, {
    short: "theme",
    name: "Themes",
    icon: faSwatchbook,
    hover: "  Theming tools",
    platform: "switch"
  },
  {
    short: "aroma",
    name: "Aroma-Ready",
    icon: faCoffee,
    hover: "  Applications that have been ported or written specifically for the aroma enviroment",
    platform: "wiiu"
  },
  // {
  //   short: "_courses",
  //   name: "Courses",
  //   icon: faRobot
  // },
  {
    short: "_misc",
    name: "Misc",
    icon: faCubes,
    hover: "  Apps that have no specific category"
  }, {
    short: "_quickstore",
    name: "QuickStore",
    icon: faFastForward,
    hover: "  Quickly compile a bundle off apps to download in one zipfile"
  },
  {
    short: "legacy",
    name: "Legacy",
    icon: faBriefcase,
    hover: "  Apps that now have limited functionality and are limited by OS version or CFW version"
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
    // OR if we have local storage, and no explicit platform is set in the URL, use local storage
    if ((pkg || !platform) && window.localStorage.getItem("platform")) {
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

  state = {
    isTooltipActive: false
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
      <div className={`Sidebar _${this.platform}_only`}>
        {
          categories.map(cat => {
            let target = cat.short !== "_all" ? `${platInfo}/category/${cat.name.toLowerCase()}` : `${platInfo || "/all"}`;
            target = (cat.short === "_search" || cat.short === "_stats" || cat.short === "_quickstore") ? `${platInfo}/${cat.short.substring(1)}` : target;

            // hide the category if it doesn't apply to the current platform
            if (this.platform && this.platform !== "all" && cat.platform && cat.platform !== this.platform) {
              return null;
            }

            return (<a
              href={target}
              key={target}
              className={`sidebar-item${choice.short === cat.short ? " selected" : ""}`}
            >

              <div
                className="icon">
                <FontAwesomeIcon icon={cat.icon} />
              </div>
              <span
                className="text"
                id={`${cat.name}`}
                onMouseEnter={e => this.setState({ toolTipCat: cat.short })}
                onMouseLeave={e => this.setState({ toolTipCat: null })}

              >
                {cat.name || "All Apps"}
              </span>

              <ToolTip
                active={this.state.toolTipCat === cat.short}
                position="right"
                arrow="center"
                parent={`#${cat.name}`}
              >
                <div className="tooltip">
                  <FontAwesomeIcon icon={cat.icon} />&nbsp;&nbsp;
                  <div className='tootipWidth right'>{cat.hover}</div>

                </div>
              </ToolTip>

            </a>);


          })
        }

      </div>

    );

  }
}

export default Sidebar;