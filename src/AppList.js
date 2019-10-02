import React, { Component } from 'react';
import AppCard from './AppCard';
import LibGet from './LibGet';
import loader from './loader.gif';
import Sidebar from './Sidebar';
import { getParams } from './Utils';

class AppList extends Component {
  state = {
    packages: null
  }

  constructor(props) {
    super(props);
    this.category = Sidebar.getCurrentCategory();
    const { platform, query } = getParams(props);
    this.platform = platform;
    this.query = query;
  }

  doesSearchMatch(query = "", pkg = {}) {
    const { title, description, details } = pkg;
    const searchUs = [title, description, details];
    return searchUs.filter(a => a && a.toLowerCase().indexOf(query.toLowerCase()) >= 0).length > 0;
  }

  static async fetchPackages(platform) {
    const repos = LibGet.getRepos(platform);

    const repoPackages = await Promise.all(
      (await LibGet.getApps(repos)).map(
        async (response) => await response.json()
      ));
    
    return repoPackages.reduce(
      (acc, cur, idx) => acc.concat(
        cur["packages"].map(pkg => ({
          ...pkg,
          repo: repos[idx].url,
          platform: repos[idx].platform
        }))
      ), []);
  }

  async componentDidMount() {
    
    let packages = await AppList.fetchPackages(this.platform);

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

    packages = packages.filter(pkg => this.doesSearchMatch(this.query, pkg));

    this.setState({ packages, query: this.query });
  }

  render() {
    const { packages } = this.state;
    const { name } = this.category;

    if (!packages) {
      return (<div className="AppList">
        <div className="left">
          <img src={loader} alt="Loading apps..." style={{width: 270, height: 130}} />
        </div>
      </div>);
    }

    let headerText = (
      <div className="catTitle">
        {name} <span className="sort"> by download count</span>
        <div className="right">
          <button>Adjust Sort</button>
          <button>Feedback</button>
          <button>Help!</button>
        </div>
      </div>);

    const updateURL = async (event) => {
      this.query = event.target.value;
      window.history.replaceState({}, "", `/search/${this.query}`);
      this.componentDidMount();
    }

    if (window.location.href.indexOf("/search") >= 0) {
      headerText = (
        <div className="catTitle">
          Search: <input type="text" onChange={updateURL} defaultValue={this.query}>
          </input>
        </div>
      )
    }

    if (packages.length === 0) {
      return (
        <div className="AppList">
          {headerText}
          No apps found for the given {this.query ? "search query" : "category"}.
        </div>)
    }

    return (
      <div className="AppList">
        { headerText }
        {
          packages.map(pkg => {
            return (
              <a className="AppCardWrapper" href={`/${pkg.platform}/${pkg.name}`}>
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
