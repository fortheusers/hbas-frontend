import React, { Component } from 'react';
import AppCard from './AppCard';
import './MainDisplay.css';
import LibGet from './LibGet';

class AppList extends Component {
  state = {
    packages: []
  }

  async componentDidMount() {
    const repoPackages = await Promise.all(
      (await LibGet.getApps()).map(
        async (response) => await response.json()
      ));
    
    const packages = repoPackages.reduce(
      (acc, cur, idx) => acc.concat(
        cur["packages"].map(pkg => ({
          ...pkg,
          repo: LibGet.repos[idx]
        }))
      ), []);

    this.setState({ packages });
  }

  render() {
    const { packages } = this.state;

    if (packages.length == 0) {
      return "Loading apps...";
    }

    return (
      <div className="AppList">
        {
          packages.map(pkg => {
            return <AppCard {...pkg} key={`${pkg.name}_${pkg.repo}`} />;
          })
        }
      </div>
    );
  }
}

export default AppList;
