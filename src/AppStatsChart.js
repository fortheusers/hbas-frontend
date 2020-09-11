import React, { PureComponent } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { getParams, FullWidthAd, Spacer, Mobile, getFirstPixelFromImage, platformIcons } from './Utils';
import LibGet from './LibGet';
import loader from './img/loader.gif';
import moment from 'moment';
import Select from 'react-select';
import AppList from './AppList';
import { TinyColor } from '@ctrl/tinycolor';


var colors = [ "#4363d8 ", "#e6194B ", "#3cb44b ", "#ffe119 ", "#f58231 ", "#911eb4 ", "#42d4f4 ", "#f032e6" ];

export default class AppStatsChart extends PureComponent {

  state = {
    stats: {},
    packages: []
  }

  async componentDidMount() {
    const { packages = this.state.packages } = this.props;
    // fetch async and save to state
    const stats = await LibGet.getStats().then(response => response.json());
    const allPackages = await AppList.fetchPackages();
    const pLookup = { "wiiu": "WiiU", "switch": "Switch" };

    // get out app details for the drop down later
    const packageDetails = allPackages.reduce((prev, pkg) => ({
      ...prev,
      [`${pLookup[pkg.platform]}/${pkg.name}`]: {
        title: pkg.title,
        count: pkg.app_dls
      }
    }), {});
    this.setState({ stats, packages, packageDetails });
  }

  render() {
    const { stats, packages, packageDetails } = this.state;

    // loading state, while waiting for async fetch
    if (Object.keys(stats).length === 0) {
      return (<div className="AppList">
        <div className="left">
          <img src={loader} alt="Loading apps..." style={{width: 270, height: 130}} />
        </div>
      </div>);
    }

    const dataByTime = packages.flatMap(pkg => {
      const [ platform, name ] = pkg.split("/");
      const curStats = stats[platform][name];
      return Object.keys(curStats).map(day => {
        const time = moment(day, "DD/MMM/YYYY").valueOf();
        return {
          value: curStats[day],
          name: pkg,
          time
        };
      });
    })
    .reduce((prev, dataPoint) => {
      const { time, name, value } = dataPoint;
      return {
        ...prev,
        [time]: {
          ...prev[time],
          [name]: value
        }
      }}, {});

    const data = Object.keys(dataByTime).map(time => 
      Object.keys(dataByTime[time]).reduce(
      (prev, curKey) => ({
        ...prev,
        [curKey]: dataByTime[time][curKey]
      }), { time }
    ))
    .sort((a, b) => a.time - b.time );
  
    const headerInfo = (
      <div className="catTitle">
        App Download Stats
    </div>);

    // actual chart
    const chartInfo = (<div
      style={{
        width: '100%',
      }}>
        <LineChart
          width={800}
          height={500}
          style={{
            margin: '0 auto'
          }}
          data={data}
          margin={{
            top: 5, right: 30, left: 20, bottom: 5,
          }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey = 'time'
          domain = {['auto', 'auto']}
          name = 'Date'
          tickFormatter = {(unixTime) => moment(unixTime).format('MMM DD YYYY')}
          type = 'number'
        />
        <YAxis />
        <Tooltip />
        <Legend />
        {
          packages.map((pkg, x) => {
            return <Line type="monotone" dataKey={pkg} stroke={`${colors[x]}`} dot={false} />;
          })
        }
      </LineChart>
    </div>);

    const allPackageNames = Object.keys(packageDetails);

    let collisions = {};
    for (let pkg of allPackageNames) {
      const [ _, name ] = pkg.split("/");
      const { [pkg]: { title } } = packageDetails;
      collisions[title] = (collisions[title] || 0) + 1;
      if (title != name) {
        collisions[name] = (collisions[name] || 0) + 1;
      }
    }

    const customStyle = {
      multiValue: (base, state) => ({
        ...base,
        backgroundColor: state.data.color,
      })
    };

    const maxOptions = 8; // gets a bit laggy after this, also we only have 8 colors
    console.log(this.state);
    const pkgSelector = <div style={{ width: 450 }}>
      <Select
        styles={customStyle}
        isMulti={true}
        placeholder="Select an app to graph stats..."
        onChange={newPackages => {
          (newPackages || []).forEach((pkg, x) => pkg.color = new TinyColor(colors[x]).brighten(35).toString());
          this.setState({ packages: (newPackages || []).map(pkg => pkg.value)})
        }}
        defaultValue={packages.map((pkg, x) => {
          const [ platform, name ] = pkg.split("/");
          const { [pkg]: { title } } = packageDetails;
          const platformInfo = collisions[name] > 1 || collisions[title] > 1 ? ` (${platform})` : "";
          return {
            value: pkg,
            label: `${title}${platformInfo}`,
            color: new TinyColor(colors[x]).brighten(35).toString()
          }
        })}
        options={packages.length >= maxOptions ? [] : allPackageNames.map(pkg => {
          const [ platform, name ] = pkg.split("/");
          const { [pkg]: { title, count } } = packageDetails;
          const platformInfo = collisions[name] > 1 || collisions[title] > 1 ? ` (${platform})` : "";
          const longLabel = `${title} (${count})${platformInfo}`;
          const label = `${title}${platformInfo}`;
          return {
            value: pkg,
            longLabel,
            label,
            platform,
            count
          };
        }).sort((b, a) => a.count - b.count)}
        noOptionsMessage={() => {
          return packages.length === maxOptions ? `Can only compare ${maxOptions} apps at a time. Remove some!` : 'N/A' ;
        }}
        formatOptionLabel={(option, { context }) =>
          context === "menu" ? option.longLabel : option.label
        }
      />
    </div>;

    return (
      <div className="AppList">
        <Mobile />
        { headerInfo }
        { pkgSelector }
        { chartInfo }
        <FullWidthAd />
        <Spacer />
      </div>
    );
  }
}
