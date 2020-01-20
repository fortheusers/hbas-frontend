import React, { Component } from 'react';
import AppCard from './AppCard';
import LibGet from './LibGet';
import loader from './img/loader.gif';
import Sidebar from './Sidebar';
import { getParams, FullWidthAd, Spacer, Mobile, stringDateToTimestamp } from './Utils';

let sorts = [{
  flavor: "by most recent",
  order: (b, a) => stringDateToTimestamp(a.updated) - stringDateToTimestamp(b.updated)
},
{
  flavor: "by download count",
  order: (b, a) => (a.web_dls + a.app_dls) - (b.web_dls + b.app_dls)
},
{
  flavor: "randomly",
  order: () => 0.5 - Math.random()
},
{
  flavor: "by file size",
  order: (b, a) => (a.filesize + a.filesize) - (b.filesize + b.filesize)
}];

class AppList extends Component {
  state = {
    packages: null,
    curSort: 0
  }

  constructor(props) {
    super(props);
    this.category = Sidebar.getCurrentCategory();
    const { platform, query } = getParams(props);
    this.platform = platform;
    this.query = query;
  }

  doesSearchMatch(query = "", pkg = {}) {
    const { title, description, author } = pkg;
    const searchUs = [title, description, author];
    return searchUs.filter(a => a && a.toLowerCase().indexOf(query.toLowerCase()) >= 0).length > 0;
  }

  async adjustSort(me) {
    let curSort = ((me.state.curSort + 1) % sorts.length);
    me.setState({curSort});
    await me.sortLogic(me);
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
    await this.sortLogic(this);
  }

  async sortLogic(me) {
    
    let packages = await AppList.fetchPackages(this.platform);

    // perform the actual sort of packages, based on current sort / category
    packages = packages.sort(sorts[me.state.curSort].order);

    const cats = new Set(Sidebar.getAllCategories().map(cat => cat.short));

    const { short } = me.category;
    // let through for all and search, and misc only if not in any others
    packages = packages.filter(pkg => {
      return (pkg.category === short || (short === "_all" && pkg.category !== "theme")) ||
        (short === "_misc" && !cats.has(pkg.category)) ||
        (short === "_search");
    });

    packages = packages.filter(pkg => me.doesSearchMatch(me.query, pkg));

    me.setState({ packages, query: me.query });
  }

  render() {
    const { packages, curSort } = this.state;
    const { name } = this.category;

    if (!packages) {
      return (<div className="AppList">
        <div className="left">
          <img src={loader} alt="Loading apps..." style={{width: 270, height: 130}} />
        </div>
      </div>);
    }

    let fdbk = () => {
      window.location.href = ("mailto:fight@fortheusers.org?subject=[HBAS] App Store Feedback"); // temp link
    }
    let help = () => {
      window.location.href = (`https://discord.gg/F2PKpEj`); // temp link 
    }

    let { flavor: sortFlavor } = sorts[curSort];

    let headerText = (
      <div className="catTitle">
        <div className="menuspan">
        {name} <br className="mobilebr"></br><span className="sort">{sortFlavor}</span>
        </div>
        <div className="menu">
              <button onClick={() => this.adjustSort(this)}>Adjust Sort</button>
              <button id="feedback" onClick={fdbk}>Feedback</button>
              <button onClick={help}>Help!</button>  
        </div>
        </div>
      );

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
          <Mobile />
          {headerText}
          No apps found for the given {this.query ? "search query" : "category"}.
        </div>)
    }

    return (
      <div className="AppList">
        <Mobile />
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
        <FullWidthAd />
        <Spacer />
      </div>
    );
  }
}

export default AppList;
