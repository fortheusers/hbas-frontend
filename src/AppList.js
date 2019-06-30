import React, { Component } from 'react';
import AppCard from './AppCard';
import './MainDisplay.css';
import LibGet from './LibGet';
import loader from './loader.gif';
import Sidebar from './Sidebar';

class AppList extends Component {
  state = {
    packages: []
  }

  constructor(props) {
    super();
    this.props = props;
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
    const { name } = Sidebar.getCurrentCategory();

    if (packages.length === 0) {
      return (<div className="AppList">
        <img src={loader} alt="Loading apps..." style={{width: 270, height: 130}}/>
      </div>);
    }

    return (
      <div className="AppList">
        
        <h2>{name}</h2>
        {
          packages.map(pkg => {
            return (
              <a href={`/app/${pkg.name}`}>
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
