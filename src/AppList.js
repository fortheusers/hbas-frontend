import React, { Component } from 'react';
import AppCard from './AppCard';
import LibGet from './LibGet';
import loader from './loader.gif';
import Sidebar from './Sidebar';

class AppList extends Component {
  state = {
    packages: []
  }

  constructor(props) {
    super(props);
    this.category = Sidebar.getCurrentCategory();
  }

  doesSearchMatch() {

  }

  static async fetchPackages() {
    const repoPackages = await Promise.all(
      (await LibGet.getApps()).map(
        async (response) => await response.json()
      ));
    
    return repoPackages.reduce(
      (acc, cur, idx) => acc.concat(
        cur["packages"].map(pkg => ({
          ...pkg,
          repo: LibGet.repos[idx]
        }))
      ), []);
  }

  async componentDidMount() {
    
    let packages = await AppList.fetchPackages();

    // perform the actual sort of packages, based on current sort / category
    packages = packages.sort((b, a) => (a.web_dls + a.app_dls) - (b.web_dls + b.app_dls));

    const cats = new Set(Sidebar.getAllCategories().map(cat => cat.short));

    const { short } = this.category;
    // let through for all and search, and misc only if not in any others
    packages = packages.filter(pkg => {
      return (pkg.category === short || short === "_all") ||
        (short === "_misc" && !cats.has(pkg.category)) ||
        (short === "_search");
    });

    this.setState({ packages });
  }

  render() {
    const { packages } = this.state;
    const { name } = this.category;

    if (packages.length === 0) {
      return (<div className="AppList">
        <div className="left">
          <img src={loader} alt="Loading apps..." style={{width: 270, height: 130}} />
        </div>
      </div>);
    }

    return (
      <div className="AppList">
        <div className="catTitle">
          {name} <span className="sort"> by download count</span>
          <div className="right">
            <button>Adjust Sort</button>
            <button>Feedback</button>
            <button>Help!</button>
          </div>
        </div>
        {
          packages.map(pkg => {
            return (
              <a className="AppCardWrapper" href={`/app/${pkg.name}`}>
                <AppCard {...pkg} key={`${pkg.name}_${pkg.repo}`} />
              </a>)
            ;
          })
        }
      </div>
    );
  }
}

export default AppList;
