import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faThLarge, faPlay, faGamepad, faCog, faPuzzlePiece, faSwatchbook, faRobot, faCubes, faLightbulb } from '@fortawesome/free-solid-svg-icons'
import './MainDisplay';

const Categories = [
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

// to support older links:
// if there's a hash, just immediately redirect them to not having the hash
// (our URL structure should be the same, just no more hash)
if (window.location.hash) {
  window.location.href = window.location.hash.substring(1);
}

const CAT_MAGIC = "/category/";

const path = window.location.pathname.toLowerCase();
let selected = path.startsWith(CAT_MAGIC) ? 
  path.substring(CAT_MAGIC.length) : "_all";

// check if our category from the URL is valid, else default to all
const valid = Categories.find(cat => cat.name.toLowerCase() === selected || cat.short === selected)
if (valid) {
  selected = valid;
}

if (path.startsWith("/search")) {
  selected = Categories[0]; // search is 0
}

class Sidebar extends Component {
  constructor() {
    super();
    this.selected = selected;
  }

  static getCurrentCategory() {
    return selected;
  }

  static getAllCategories() {
    return Categories;
  }

  render() {
    return (
      <div className="Sidebar">
        {
          Categories.map(cat => {
            let target = cat.short !== "_all" ? `/category/${cat.name.toLowerCase()}` : '/';
            target = cat.short === "_search" ? "/search" : target;

            return (<a href={target}>
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