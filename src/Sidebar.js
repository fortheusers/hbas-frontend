import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBriefcase, faSearch, faThLarge, faPlay, faGamepad, faCog, faPuzzlePiece, faSwatchbook, faFastForward, faCubes, faChartArea, faCoffee } from '@fortawesome/free-solid-svg-icons'
import { getParams } from './Utils';
import ToolTip from 'react-portal-tooltip';
import './MainDisplay';

import { withTranslation } from 'react-i18next';

const categories = [
  {
    short: "_search",
    name: "search",
    icon: faSearch,
    hover: "searchFlavor"
  }, {
    short: "_all",
    name: "allApps",
    icon: faThLarge,
    hover: "allApps"
  }, {
    short: "_stats",
    name: "statistics",
    icon: faChartArea,
    hover: "statsFlavor"
  }, {
    short: "game",
    name: "games",
    icon: faPlay,
    hover: "gamesFlavor"
  }, {
    short: "emu",
    name: "emulators",
    icon: faGamepad,
    hover: "emulatorsFlavor"
  }, {
    short: "tool",
    name: "tools",
    icon: faCog,
    hover: "toolsFlavor"
  }, {
    short: "advanced",
    name: "advanced",
    icon: faPuzzlePiece,
    hover: "advancedFlavor",
  }, {
    short: "theme",
    name: "themes",
    icon: faSwatchbook,
    hover: "themesFlavor",
    platform: "switch"
  },
  {
    short: "aroma",
    name: "aroma",
    icon: faCoffee,
    hover: "aromaFlavor",
    platform: "wiiu"
  },
  // {
  //   short: "_courses",
  //   name: "Courses",
  //   icon: faRobot
  // },
  {
    short: "_misc",
    name: "misc",
    icon: faCubes,
    hover: "miscFlavor"
  }, {
    short: "_quickstore",
    name: "quickstore",
    icon: faFastForward,
    hover: "qsFlavor"
  },
  {
    short: "legacy",
    name: "legacy",
    icon: faBriefcase,
    hover: "legacyFlavor"
  },
];

let selected = "_all";
let choice = "_all";

export function getCurrentCategory() {
  return selected;
}

export function getAllCategories() {
  return categories;
}

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

    // make sure platform is valid, else default to all
    const validPlatform = categories.find(cat => cat.platform === platform);
    this.platform = validPlatform ? platform : "all";

  }

  state = {
    isTooltipActive: false
  }

  render() {
    const platInfo = (this.platform && this.platform !== "all") ? `/${this.platform}` : "";

    const { t } = this.props;
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
                {t(cat.name) || t("allApps")}
              </span>

              <ToolTip
                active={this.state.toolTipCat === cat.short}
                position="right"
                arrow="center"
                parent={`#${cat.name}`}
              >
                <div className="tooltip">
                  <FontAwesomeIcon icon={cat.icon} />&nbsp;&nbsp;
                  <div className='tootipWidth right'>{t(cat.hover)}</div>

                </div>
              </ToolTip>

            </a>);


          })
        }

      </div>

    );

  }
}

export default withTranslation()(Sidebar);