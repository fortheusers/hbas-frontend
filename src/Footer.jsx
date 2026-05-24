import React, { Component } from 'react';
import {init_theme, toggle_theme} from './Utils';
import './MainDisplay.css';
import { withTranslation } from 'react-i18next';
import i18n from './i18n';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Русский' },
  { code: 'es', label: 'Español' },
];

class Footer extends Component {
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
          <select
            style={{fontSize: 10, padding: 4, marginRight: 8, verticalAlign: "top"}}
            value={i18n.language}
            onChange={e => i18n.changeLanguage(e.target.value)}
          >
            {LANGUAGES.map(({ code, label }) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
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
