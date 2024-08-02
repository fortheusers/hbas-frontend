import React, { Component, Fragment } from 'react';
import { Trans } from 'react-i18next';
import AppCard from './AppCard';
import LibGet from './LibGet';
import loader from './img/loader.gif';
import { getCurrentCategory, getAllCategories } from './Sidebar';
import { getParams, Spacer, Mobile, stringDateToTimestamp } from './Utils';
import PlatformPicker from './PlatformPicker';
import icon from './img/icon.png';

import { withTranslation } from 'react-i18next';

export async function fetchPackages(platform) {
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

export async function fetchCredits() {
  const creditsResp = await fetch(`https://fortheusers.github.io/meta-repo/credits.json`);
  const { credits } = await creditsResp.json();
  return credits;
}

let sorts = [{
  flavor: "listing.sort.recent",
  order: (b, a) => stringDateToTimestamp(a.updated) - stringDateToTimestamp(b.updated)
},
{
  flavor: "listing.sort.downloads",
  order: (b, a) => a.app_dls - b.app_dls
},
{
  flavor: "listing.sort.alpha",
  order: (a, b) => a.title.localeCompare(b.title)
},
{
  flavor: "listing.sort.random",
  order: () => 0.5 - Math.random()
},
{
  flavor: "listing.sort.size",
  order: (b, a) => (a.filesize + a.filesize) - (b.filesize + b.filesize)
}];

class AppList extends Component {
  state = {
    packages: null,
    curSort: 0
  }

  constructor(props) {
    super(props);
    this.category = getCurrentCategory();
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

  async componentDidMount() {
    await this.sortLogic(this);
  }

  async sortLogic(me) {
    
    let packages = await fetchPackages(this.platform);

    // perform the actual sort of packages, based on current sort / category
    packages = packages.sort(sorts[me.state.curSort].order);

    const cats = new Set(getAllCategories().map(cat => cat.short));

    const { short } = me.category;
    // let through for all and search, and misc only if not in any others
    packages = packages.filter(pkg => {
      return (pkg.category === short || (short === "_all" && pkg.category !== "theme")) ||
        (short === "_misc" && !cats.has(pkg.category)) ||
        (me.query);
    });

    packages = packages.filter(pkg => me.doesSearchMatch(me.query, pkg));

    me.setState({ packages, query: me.query });
  }

  render() {
    const { packages, curSort } = this.state;
    const { name } = this.category;
    const { t } = this.props;

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

    let { flavor: sortFlavor } = sorts[curSort];

    const isOnHome = window.location.pathname === "" || window.location.pathname === "/";

    const platformPicker = isOnHome ? (
      <div id="homeBlurb" style={{
        marginBottom: 10,
        marginLeft: 50,
        marginRight: 50,
        marginTop: 10
      }}>
        <div style={{padding: 10, textAlign: "center"}}>
          <img src={icon} alt="AppStore Logo" />
          <span style={{padding: 10}}>Homebrew App Store</span>
        </div>
        <p>
          <Trans i18nKey="homebrewDescription">
            <a href="https://en.wikipedia.org/wiki/Homebrew_(video_games)">homebrew apps</a>
          </Trans>
        </p>
        <p>
          <Trans i18nKey="submitRequest">
            <a href="/submit-or-request">Submit</a>
            <a href="/about">About</a>
          </Trans>
        </p>
        <PlatformPicker />
      </div>
    ) : null;

    let headerText = (<Fragment>
      {platformPicker}
      <div className="catTitle">
        <div className="menuspan">
        {t(name)} <br className="mobilebr"></br><span className="sort">{t(sortFlavor)}</span>
        </div>
        <div className="menu">
              <button onClick={() => this.adjustSort(this)}>{t("adjustSort")}</button>
              <button id="feedback" onClick={fdbk}>{t("leaveFeedback")}</button>
              {/* <button onClick={help}>Help!</button>   */}
        </div>
        </div>
      </Fragment>);

    const updateURL = async (event) => {
      this.query = event.target.value;
      window.history.replaceState({}, "", `/search/${this.query}`);
      this.componentDidMount();
    }

    if (window.location.href.indexOf("/search") >= 0) {
      headerText = (
        <div className="catTitle">
          Search: <input id="searchBox" type="text" onChange={updateURL} defaultValue={this.query}>
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
        {/* <FullWidthAd /> */}
        <Spacer />
      </div>
    );
  }
}

export default withTranslation()(AppList);