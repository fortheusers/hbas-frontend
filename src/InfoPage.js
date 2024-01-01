import React, { Component } from 'react';
import { Spacer, Mobile } from './Utils';

class InfoPage extends Component {
  render() {
    // temporary, until pages are implemented
    const location = window.location.pathname;

    if (location === "/about") {
      window.location.href = "https://fortheusers.org";
    } else if (location === "/api-info") {
      window.location.href = "https://github.com/fortheusers/libget/wiki/Overview-&-Glossary#repos";
    } else if (location === "/submit-or-request") {
      window.location.href = "https://submit.fortheusers.org/";
    }
 
    const pageText = <div>
      This page intentionally left blank.
    </div>;

    return (
      <div className="AppList">
        <Mobile />
        { pageText }
        <Spacer />
      </div>
    );
  }
}

export default InfoPage;
