import React, { PureComponent } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { Spacer, Mobile } from './Utils';
import LibGet from './LibGet';
import loader from './img/loader.gif';
import moment from 'moment';
import Select from 'react-select';
import AppList from './AppList';
import { TinyColor } from '@ctrl/tinycolor';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import 'react-day-picker/lib/style.css';
import {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';

var colors = [ "#4363d8 ", "#e6194B ", "#3cb44b ", "#ffe119 ", "#f58231 ", "#911eb4 ", "#42d4f4 ", "#f032e6" ];

export default class AppStatsChart extends PureComponent {

  state = {
    stats: {},
    packages: [],
    start: new Date(new Date() - 14 * (1000 * 24 * 60 * 60)), // two weeks default
    end: new Date(),
    useAuto: false
  }

  async componentDidMount() {
    // fetch async and save to state
    const statsProper = await LibGet.getStats().then(response => response.json());
    const allPackages = await AppList.fetchPackages();

    const { start: ogStart, end: ogEnd } = this.state;

    // make our stats response all lowercase (easier for urls)
    // (two layers... nested and confusing looking)
    // https://stackoverflow.com/a/43630848
    const stats = Object.fromEntries(
      Object.entries(statsProper).map(([k, v]) => [k.toLowerCase(),
        Object.fromEntries(
          Object.entries(v).map(([k2, v2]) => [k2.toLowerCase(), v2])
        )
      ])
    );

    // get out app details for the drop down later
    const packageDetails = allPackages.reduce((prev, pkg) => ({
      ...prev,
      [`${pkg.platform}/${pkg.name}`.toLowerCase()]: {
        title: pkg.title,
        count: pkg.app_dls
      }
    }), {});

    // try to load comma separated apps from query string
    const queryString = require('query-string');
    const parsed = queryString.parse(this.props.location.search);
    const { apps, time = "" } = parsed;

    const [ start, end, useAuto ] = time.split(":");

    this.setState({
      stats,
      packages: apps ? apps.toLowerCase().split(",") : [],
      packageDetails,
      ogStart, ogEnd,
      ...(!!time ? {start: new Date(+start), end: new Date(+end), useAuto: useAuto === "true"} : {})
    });
  }

  last(days) {
    this.setState({
      start: new Date(new Date() - days * (1000 * 24 * 60 * 60)),
      end: new Date()
    }, this.updateQueryParams)
  }

  updateQueryParams() {
    // updates the URL with the current apps and time range states
    const { packages, start, end, ogStart, ogEnd, useAuto } = this.state;
    const apps = `?apps=${packages.join(",")}`;
    const time = start === ogStart && end === ogEnd ? "" : `&time=${start.getTime()}:${end.getTime()}:${useAuto}`;

    window.history.pushState(null, '', window.location.pathname + apps + time);
  }

  render() {
    const { stats, packages, packageDetails, start, end, useAuto } = this.state;

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
      if (!stats[platform] || !stats[platform][name]) return null; // no stats for this packge

      const { [platform]: { [name]: curStats } } = stats;
      return Object.keys(curStats).map(day => {
        const time = moment(day, "DD/MMM/YYYY").valueOf();
        if (!useAuto && (time < start || time > end)) return null;

        return {
          value: curStats[day],
          name: pkg,
          time
        };
      });
    }).filter(a => !!a)
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
          domain = {useAuto ? ['auto', 'auto' ] : [ start.getTime(), end.getTime() ]}
          name = 'Date'
          tickFormatter = {(unixTime) => moment(unixTime).format('MMM DD YYYY')}
          type = 'number'
        />
        <YAxis />
        <Tooltip />
        <Legend />
        {
          packages.map((pkg, x) => {
            return <Line
              type="monotone"
              dataKey={pkg}
              stroke={`${colors[x]}`}
              dot={false}
              strokeWidth={2}
            />;
          })
        }
      </LineChart>
    </div>);

    const allPackageNames = Object.keys(packageDetails);

    let collisions = {};
    for (let pkg of allPackageNames) {
      // eslint-disable-next-line
      const [ _, name ] = pkg.split("/");
      const { [pkg]: { title } } = packageDetails;
      collisions[title] = (collisions[title] || 0) + 1;
      if (title !== name) {
        collisions[name] = (collisions[name] || 0) + 1;
      }
    }

    const darkStyles = {
      control: (provided, state) => ({
        ...provided,
        backgroundColor: "black",
        color: "#000000",
        
      }),
      option: (provided, state) => ({
        ...provided,
        backgroundColor: 'black',
      })
    };

    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    const customStyle = {
      multiValue: (base, state) => ({
        ...base,
        backgroundColor: state.data.color,
      }),
      ...(isDarkMode ? darkStyles : {})
    };

    const maxOptions = 8; // gets a bit laggy after this, also we only have 8 colors
    const pkgSelector = <div style={{ width: 450 }}>
      <Select
        styles={customStyle}
        isMulti={true}
        placeholder="Select an app to graph stats..."
        onChange={newPackages => {
          (newPackages || []).forEach((pkg, x) => pkg.color = new TinyColor(colors[x]).brighten(35).toString());
          this.setState({ packages: (newPackages || []).map(pkg => pkg.value)}, this.updateQueryParams);
        }}
        defaultValue={packages.map((pkg, x) => {
          const [ platform, name ] = pkg.split("/");
          if (!packageDetails[pkg]) return null; // protect against bad pkg name
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
        }).filter(a => !!a).sort((b, a) => a.count - b.count)}
        noOptionsMessage={() => {
          return packages.length === maxOptions ? `Can only compare ${maxOptions} apps at a time. Remove some!` : 'N/A' ;
        }}
        formatOptionLabel={(option, { context }) =>
          context === "menu" ? option.longLabel : option.label
        }
      />
    </div>;

    const dayPicker = <div>
      <div style={{
        opacity: useAuto ? '30%' : '100%',
        pointerEvents: useAuto ? 'none' : 'auto'
      }}>
        Range:&nbsp;&nbsp;
        <DayPickerInput
          placeholder="Start Day"
          value={start}
          onDayChange={day => day && this.setState({ start: day }, this.updateQueryParams)}
          formatDate={formatDate}
          parseDate={parseDate}
        />
        &nbsp;&nbsp;to&nbsp;&nbsp;
        <DayPickerInput
          placeholder="End Day"
          value={end}
          onDayChange={day => day && this.setState({ end: day }, this.updateQueryParams)}
          formatDate={formatDate}
          parseDate={parseDate}
        />
        <div style={{
          marginTop: 25,
        }}>
          <button onClick={() => this.last(14)}>Last 14 Days</button>
          <button onClick={() => this.last(30)}>Last Month</button>
          <button onClick={() => this.last(90)}>Last 90 Days</button>
          <button onClick={() => this.last(365)}>Last Year</button>
        </div>
      </div>
      <div style={{
        marginTop: 20
      }}>
        <input type="checkbox" id="alltime" checked={useAuto} onClick={
          e => this.setState({ useAuto: e.target.checked }, this.updateQueryParams)
        } />
        <label for="alltime">Show data for All Time (automatically sets time range)</label>
      </div>
    </div>;

    const warningNotice = <div className="warningNotice">
      <FontAwesomeIcon icon={faExclamationTriangle} className={"fa-warn"} />
      <div>
        <p>Since the 2.3 hb-appstore update (in March 2023), app download stats on this page will appear to drop off, and be <strong>significantly lower</strong> than their actual values. This is a result of console users updating and switching to our new CDN servers.</p>
        <p>Accurate download data is still being collected and stored! However, it is not yet surfaced on this Statistics page. <strong>All historical data will be viewable after this is addressed!</strong> Thank you for understanding.</p>
      </div>
    </div>;
  
    return (
      <div className="AppList">
        <Mobile />
        { warningNotice }
        { headerInfo }
        { pkgSelector }
        { chartInfo }
        { dayPicker }
        {/* <FullWidthAd /> */}
        <Spacer />
      </div>
    );
  }
}
