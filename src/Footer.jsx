import React, { Component } from 'react';
import {init_theme, toggle_theme} from './Utils';
import './MainDisplay.css';
import { withTranslation } from 'react-i18next';

class Footer extends Component {
  // on mount, set the theme
  componentDidMount() {
    init_theme();
  }

  render() {
    const { t } = this.props;
    return (
      <div className="Footer">
        <div className="left">
          <a className="copyright" href="https://gitlab.com/4TU/hbas-frontend/blob/master/LICENSE">
            <span className="copyleft">&copy;</span> {t("gplLicense")}</a>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a className="copyright" href="/request-takedown">{t("dmca")}</a>
        </div>
        <div className="right">
          <button style={{fontSize: 10, padding: 4, marginRight: 15, verticalAlign: "top"}} onClick={toggle_theme}>
            {t("changeTheme")}
          </button>
          {t("disclaimer")}
        </div>
      </div>
    );
  }
}

export default withTranslation()(Footer);
