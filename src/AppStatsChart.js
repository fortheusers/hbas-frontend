import React, { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { Spacer, Mobile } from './Utils';
import loader from './img/loader.gif';
import moment from 'moment';
import Select from 'react-select';
import {fetchPackages} from './AppList';
import { TinyColor } from '@ctrl/tinycolor';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';
import {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';

import { useTranslation } from 'react-i18next';

var colors = [ "#4363d8 ", "#e6194B ", "#3cb44b ", "#ffe119 ", "#f58231 ", "#911eb4 ", "#42d4f4 ", "#f032e6" ];

const AppStatsChart = () => {

  const defaultState = {
    stats: {},
    packages: [],
    start: new Date(new Date() - 14 * (1000 * 24 * 60 * 60)), // two weeks default
    end: new Date(),
    packageDetails: {},
    useAuto: false,
    hasLoaded: false
  };
  const [ state, setState ] = useState(defaultState);
  
  function last(days) {
    setState({
      ...state,
      start: new Date(new Date() - days * (1000 * 24 * 60 * 60)),
      end: new Date()
    })
  }

  // update our query params when the state changes
  useEffect(() => {
    // updates the URL with the current apps and time range states
    const { packages, start, end, ogStart, ogEnd, useAuto,hasLoaded } = state;
    if (!hasLoaded) return;    // only do this if we've loaded already
    const apps = `?apps=${packages.join(",")}`;
    const time = start === ogStart && end === ogEnd ? "" : `&time=${start.getTime()}:${end.getTime()}:${useAuto}`;

    window.history.pushState(null, '', window.location.pathname + apps + time);
  }, [state]);

  function numFormat(count) {
    // format a number with commas
    return count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  useEffect(() => {
    async function loadData() {
      // fetch async and save to state
      const allPackages = await fetchPackages();

      const { start: ogStart, end: ogEnd } = state;

      // get out app details for the drop down later
      const packageDetails = allPackages.reduce((prev, pkg) => ({
        ...prev,
        [`${pkg.platform}/${pkg.name}`.toLowerCase()]: {
          title: pkg.title,
          count: pkg.app_dls,
          properName: pkg.name,
        }
      }), {});

      // try to load comma separated apps from query string
      const queryString = require('query-string');
      const parsed = queryString.parse(window.location.search);
      const { apps, time = "" } = parsed;

      const [ start, end, useAuto ] = time.split(":");

      setState({
        ...state,
        stats: {},
        packages: apps ? apps.toLowerCase().split(",") : [],
        packageDetails,
        ogStart, ogEnd,
        hasLoaded: true,
        ...(!!time ? {start: new Date(+start), end: new Date(+end), useAuto: useAuto === "true"} : {})
      });
    }
    if (!state.hasLoaded) {
      loadData();
    }
  }, [setState, state]);


  // render code
  const { stats, packages, packageDetails, start, end, useAuto } = state;
  const { t } = useTranslation();

  useEffect(() => {
    async function reloadPackages() {
      // every time packages changes, try to fetch stats data for each package, if we don't have them already
      const { packages, stats } = state;
      const newStats = { ...stats };
      for (let pkg of packages) {
        const [ platform ] = pkg.split("/");
        const fixedPlatform = platform === "wiiu" ? "WiiU" : "Switch";
        // look up the fixed package name from the package details
        const { properName } = packageDetails[pkg];

        if (!properName) {
          console.error(`Failed to find package details for ${pkg}`);
          continue;
        }
        if (!newStats[pkg]) {
          // fetch the data
          const statsUrl = `https://wiiubru.com/history/output_${fixedPlatform}/${properName}.json`;
          try {
            const response = await fetch(statsUrl);
            const json = await response.json();
            newStats[pkg] = json;
            setState({ ...state, stats: newStats });
          } catch (e) {
            console.error(`Failed to fetch stats for ${pkg}`, e);
          }
        }
      }
    }
    reloadPackages()
  }, [state, packageDetails, setState]);

  // loading state, while waiting for async fetch
  if (packageDetails && Object.keys(packageDetails).length === 0) {
    return (<div className="AppList">
      <div className="left">
        <img src={loader} alt="Loading apps..." style={{width: 270, height: 130}} />
      </div>
    </div>);
  }

  const dataByTime = packages.flatMap(pkg => {
    if (!stats[pkg]) return null; // no stats for this packge

    const { [pkg]: statsByYear } = stats;

    // format the new stats payload into the old one, keyed by day string
    const curStats = {};
    for (let year in statsByYear) {
      for (let month in statsByYear[year]) {
        for (let x=0; x<statsByYear[year][month].length; x++) {
          const count = statsByYear[year][month][x];
          if (count > 0) {
            const key = `${x+1 < 10}${x+1}/${month}/${year}`;
            curStats[key] = count;
          }
        }
      }
    }
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
      {t("appDownloadStats")}
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
      <Tooltip 
        labelFormatter={(unixTime) => {
          return moment.unix(unixTime / 1000).format('MMM DD YYYY');
        }}
      />
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

  const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)') && window.matchMedia('(prefers-color-scheme: dark)').matches;

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
      placeholder={t("selectPrompt")}
      onChange={newPackages => {
        (newPackages || []).forEach((pkg, x) => pkg.color = new TinyColor(colors[x]).brighten(35).toString());
        setState({ ...state, packages: (newPackages || []).map(pkg => pkg.value)});
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
        const longLabel = `${title} (${numFormat(count)})${platformInfo}`;
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
      {t("range")}&nbsp;&nbsp;
      <DayPickerInput
        placeholder="Start Day"
        value={start}
        onDayChange={day => day && setState({ ...state, start: day })}
        formatDate={formatDate}
        parseDate={parseDate}
      />
      &nbsp;&nbsp;{t("to")}&nbsp;&nbsp;
      <DayPickerInput
        placeholder="End Day"
        value={end}
        onDayChange={day => day && setState(...state, { end: day })}
        formatDate={formatDate}
        parseDate={parseDate}
      />
      <div style={{
        marginTop: 25,
      }}>
        <button onClick={() => last(14)}>{t("last14")}</button>
        <button onClick={() => last(30)}>{t("lastMonth")}</button>
        <button onClick={() => last(90)}>{t("last90")}</button>
        <button onClick={() => last(365)}>{t("lastYear")}</button>
      </div>
    </div>
    <div style={{
      marginTop: 20
    }}>
      <input type="checkbox" id="alltime" checked={useAuto} onClick={
        e => setState({ ...state, useAuto: e.target.checked })
      } />
      <label for="alltime">{t("allTime")}</label>
    </div>
  </div>;

  return (
    <div className="AppList">
      <Mobile />
      { headerInfo }
      { pkgSelector }
      { chartInfo }
      { dayPicker }
      {/* <FullWidthAd /> */}
      <Spacer />
    </div>
  );
}

export default AppStatsChart;