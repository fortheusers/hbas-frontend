import React, { PureComponent } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { getParams, FullWidthAd, Spacer, Mobile, getFirstPixelFromImage, platformIcons } from './Utils';
import LibGet from './LibGet';
import loader from './img/loader.gif';
import moment from 'moment'

export default class AppStatsChart extends PureComponent {

  state = {
    stats: {},
    packages: [ 'WiiU/vgedit', 'Switch/vgedit' ]
  }

  async componentDidMount() {
    const { packages = this.state.packages } = this.props;
    // fetch async and save to state
    const stats = await LibGet.getStats().then(response => response.json());
    this.setState({ stats, packages });
  }

  render() {
    const { stats, packages } = this.state;

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
          packages.map(pkg => {
            return <Line type="monotone" dataKey={pkg} stroke={`#${Math.floor(Math.random()*16777215).toString(16)}`} dot={false} />;
          })
        }
      </LineChart>
    </div>);

    return (
      <div className="AppList">
        <Mobile />
        { headerInfo }
        { chartInfo }
        <FullWidthAd />
        <Spacer />
      </div>
    );
  }
}
