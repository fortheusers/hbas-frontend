import React, { Component, Fragment } from 'react';
import { Trans } from 'react-i18next';
import { withTranslation } from 'react-i18next';

import { Spacer, Mobile } from './Utils';
import {fetchCredits, fetchPackages} from './AppList';
import twitterImg from './img/twitter.png';
import githubImg from './img/github.png';
import gitlabImg from './img/gitlab.png';
import patreonImg from './img/patreon.png';
import discordImg from './img/discord.png';
import youtubeImg from './img/youtube.png';
import urlImg from './img/url.png';
import bskyImg from './img/bsky.png';
import mastodonImg from './img/mastodon.png';
import switchImg from './img/switch.png';
import wiiuImg from './img/wiiu.png';
import dropDownCarat from './img/dropDownCarat.png';

const WIIU_CDN = "https://wiiu.cdn.fortheusers.org/repo.json";
const SWITCH_CDN = "https://switch.cdn.fortheusers.org/repo.json";

class InfoPage extends Component {
  
  state = {
    allPackages: [],
    credits: [],
    curRepo: WIIU_CDN,
    curPackage: "vgedit"
  }

  async componentDidMount() {
    const location = window.location.pathname;

    if (location === "/about") {
      let credits = await fetchCredits();
      this.setState({ credits });
    }

    if (location !== "/submit-or-request") {
      let allPackages = await fetchPackages();
      allPackages.sort((a, b) => a.title.localeCompare(b.title));
      this.setState({ allPackages })

      // on the api page, we need to update one dropdown
      if (location === "/api-info") {
        document.getElementById("packageSelect").value = this.state.curPackage;
      }
    }

  }

  render() {
    let pageText = <div>
      This page intentionally left blank.
    </div>;

    const { t } = this.props;

    const location = window.location.pathname;

    if (location === "/about") {

      let authorSet = new Set(); // unique list of all lowercase authors
      let authorGithubMap = {}; // lowercased author name -> github url
      let authorNameMap = {}; // lowercased author name -> proper caps author name
      let hbasPageMap = {}; // lowercased author name -> array of hbas page urls

      let githubUrlToAuthorsMap = {}; // github urls -> array of lowercased author names
                                      // used to prevent author GH pages from being misattributed
      for (let pkg of this.state.allPackages) {
        if (pkg.author) {
          let authorLower = pkg.author.toLowerCase().replaceAll("_", "-");
          authorSet.add(authorLower);
          if (pkg.url && pkg.url.startsWith("https://github.com")) {
            let github = pkg.url.split("/").slice(0, 4).join("/");
            authorGithubMap[authorLower] = github;
            if (!githubUrlToAuthorsMap[github]) {
              githubUrlToAuthorsMap[github] = [];
            }
            githubUrlToAuthorsMap[github].push(authorLower);
          }
          authorNameMap[authorLower] = pkg.author;
          if (!hbasPageMap[authorLower]) {
            hbasPageMap[authorLower] = [];
          }
          hbasPageMap[authorLower].push({
            url: `/${pkg.platform}/${pkg.name}`,
            name: pkg.title,
            platform: pkg.platform
          });
        }
      }

      // // go through our author list and split out names that are actually multiple authors
      // // this is a bit of a hack, but it's better than not doing it
      for (let authorLowercased of authorSet) {
        let author = authorNameMap[authorLowercased];
        let authors = [];
        if (author.includes(" & ")) {
          authors.push(...author.split(" & "));
        }
        else if (author.includes(" and ")) {
          authors.push(...author.split(" and ").map(a => a.replaceAll(",", "")));
        }
        else if (author.includes(", ")) {
          authors.push(...author.split(", "));
        } else if (author.includes(" / ")) {
          authors.push(...author.split(" / "));
        } else {
          // no splitting needed
          continue;
        }
        // remove the original author
        authorSet.delete(authorLowercased);
        // add each new author
        for (let newAuthorOrig of authors) {
          const newAuthor = newAuthorOrig.toLowerCase().replaceAll("_", "-");
          authorSet.add(newAuthor);
          // if we don't have a github url for this author, but we do for the original author, copy it over
          if (!authorGithubMap[newAuthor]) {
            authorGithubMap[newAuthor] = authorGithubMap[authorLowercased];
          }

          // if we DO have a github url, update our githubUrlToAuthorsMap
          if (authorGithubMap[newAuthor]) {
            let github = authorGithubMap[newAuthor];
            if (!githubUrlToAuthorsMap[github]) {
              githubUrlToAuthorsMap[github] = [];
            }
            githubUrlToAuthorsMap[github].push(newAuthor);
          }

          // copy over hbas page info for the new author name
          authorNameMap[newAuthor] = newAuthorOrig;
          if (!hbasPageMap[newAuthor]) {
            hbasPageMap[newAuthor] = [];
          }
          hbasPageMap[newAuthor].push(...hbasPageMap[authorLowercased]);
        }
      }

      // // go through the githubUrlToAuthorsMap and remove any github urls that are shared by multiple authors
      // // using the levenshtein distance algorithm to guess which author is the best fit
      // // TODO: actually track author github urls in the backend, so we don't have to do this
      for (let github in githubUrlToAuthorsMap) {
        let authors = githubUrlToAuthorsMap[github];

        // extract author name from the github url
        let githubAuthor = github.split("/")[3].toLowerCase();

        // if the author name is already in the list, just use that
        let bestAuthor = authors.find(author => author === githubAuthor);

        if (!bestAuthor) {
          // otherwise, try to find the best fit
          let bestDistance = Infinity;
          console.log(authors);
          for (let author of authors) {
            let distance = levenshtein(author, githubAuthor);
            if (distance < bestDistance) {
              bestDistance = distance;
              bestAuthor = author;
            }
          }
          // console.log(`best fit for ${github} is ${bestAuthor}`)
        }

        // remove all authors except the best fit (and only delete if they have the mismatched github url)
        for (let author of authors) {
          if (author !== bestAuthor && authorGithubMap[author] === github) {
            delete authorGithubMap[author];
          }
        }
      }

      // remove some common non-authors
      const commonNonAuthors = ["and", "more", "others", "various authors"];
      for (let nonAuthor of commonNonAuthors) {
        if (authorSet.has(nonAuthor))
          authorSet.delete(nonAuthor);
      }

      let hbasCreditsHTML = genHBASCreditsHTML(this.state.credits);
      const platImgLookup = {
        "switch": switchImg,
        "wiiu": wiiuImg
      }

      let authorList = <table className="appAuthorList">
        {Array.from(authorSet).sort().map(author => (
          <tr>
            <td><a href={authorGithubMap[author]}>{authorNameMap[author] || author}</a></td>
            <td>{(hbasPageMap[author] || []).map(pageInfo => <Fragment><a href={pageInfo.url}><img src={platImgLookup[pageInfo.platform]} alt={pageInfo.platform} />{pageInfo.name}</a>{" "}</Fragment>)}</td>
          </tr>
        ))}
      </table>;

      pageText = <div>
        <h1><Trans i18nKey="aboutTitle" /></h1>
        <p className="pNormalWidth">
          <Trans i18nKey="aboutDescription1">
            <a href="https://en.wikipedia.org/wiki/Homebrew_(video_games)">Homebrew</a>
            <a href="https://fortheusers.org">ForTheUsers</a>
          </Trans>
        </p>
        <p className="pNormalWidth">
          <Trans i18nKey="aboutDescription2">
            <a href="/submit-or-request">Submit</a>
            <a href="/api-info">API Info</a>
          </Trans>
        </p>
        <p className="pNormalWidth">
          <Trans i18nKey="aboutDescription3">
            <a href="/request-takedown">Removal Page (or DMCA)</a>
          </Trans>
        </p>
        <h3><Trans i18nKey="howItWorksTitle" /></h3>
        <p className="pNormalWidth">
          <Trans i18nKey="howItWorksDescription1">
            <a href="https://github.com/fortheusers/hb-appstore">Github</a>
            <a href="https://github.com/fortheusers/hb-appstore/releases">Download</a>
          </Trans>
        </p>
        <p className="pNormalWidth">
          <Trans i18nKey="howItWorksDescription2">
            <a href="https://discord.gg/F2PKpEj">Discord</a>
          </Trans>
        </p>
        <p className="pNormalWidth">
          <Trans i18nKey="howItWorksDescription3">
            <a href="https://dribbble.com/shots/10302424-Nintendo-Controllers">Art Credit</a>
          </Trans>
        </p>
        <p style={{marginTop: -40}} className="pNormalWidth creditsContainer" dangerouslySetInnerHTML={{__html: hbasCreditsHTML}}>
        </p>
        <h3>App Authors</h3>
        <p className="pNormalWidth">
          <Trans i18nKey="appAuthorsDescription" /><br/><br/>
          {authorList}
        </p>

        <h3><Trans i18nKey="donationsTitle" /></h3>
        <p className="pNormalWidth">
          <Trans i18nKey="donationsDescription1" />
        </p>
        <p className="pNormalWidth">
          <Trans i18nKey="donationsDescription2" />
          <br/><br/>
          <table className="donationList">
            <tr>
              <td><a href="https://donate.wikimedia.org/">Wikipedia / Wikimedia</a></td>
              <td><a href="https://www.eff.org">Electronic Frontier Foundation</a></td>
              <td><a href="https://www.savethechildren.org">Save the Children</a></td>
              <td><a href="https://www.pih.org">Partners in Health</a></td>
            </tr><tr>
              <td><a href="https://gfi.org">Good Food Institute</a></td>
              <td><a href="https://mercyforanimals.org">Mercy for Animals</a></td>
              <td><a href="https://fandomforward.org">Fandom Forward</a></td>
              <td><a href="https://nanowrimo.org">NaNoWriMo</a></td>
            </tr>
          </table>
        </p>
        <h3><Trans i18nKey="licensingTitle" /></h3>
        <p className="pNormalWidth">
          <Trans i18nKey="licensingDescription">
            <a href="https://www.gnu.org/licenses/gpl-3.0.en.html">GPLv3 License</a>
            <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.en">CC License</a>
          </Trans>
        </p>
        <p className="pNormalWidth">
          <Trans i18nKey="finalNote">
            <a href="https://discord.gg/F2PKpEj">Discord Link</a>
          </Trans>
        </p>
        <br/><br/><br/><br/><br/><br/><br/><br/><br/>
      </div>;
    } else if (location === "/api-info") {
      const { curRepo, curPackage } = this.state;

      // deep clone, so we can modify the internal already-fetched packages to resemble the API output
      let packages = JSON.parse(JSON.stringify(this.state.allPackages));
      packages = packages.filter(pkg => pkg.platform === (curRepo.includes("switch") ? "switch" : "wiiu"));
      for (let pkg of packages) {
        // these aren't part of the API
        delete pkg.repo;
        delete pkg.platform;
      }

      const repoBase = curRepo.replaceAll("/repo.json", "");

      // for the screenshot queries, later
      const screensCount = (packages.find(pkg => pkg.name === `${curPackage}`) || {}).screens || 0;
      const screensArray = [...Array(screensCount).keys()]

      pageText = <div style={{maxWidth: "100%"}}>
        <h1><Trans i18nKey="apiInfo" /></h1>
        <p className="pNormalWidth">
          <Trans i18nKey="websiteDescription">
            <a href="https://hb-app.store">hb-app.store</a>
            <a href="https://github.com/fortheusers/hb-appstore">console app</a>
            <a href="https://gitlab.com/4TU/hbas-frontend/">this site</a>
          </Trans>
        </p>
        <p className="pNormalWidth">
          {t("repositoriesDescription")}
          <ul>
            <li><img src={wiiuImg} style={{width: 24, verticalAlign: "middle", marginRight: 10 }} alt="Wii U" /><a href="https://wiiu.cdn.fortheusers.org/repo.json">wiiu.cdn.fortheusers.org/repo.json</a></li>
            <li><img src={switchImg} style={{width: 24, verticalAlign: "middle", marginRight: 10 }} alt="Switch" /><a href="https://switch.cdn.fortheusers.org/repo.json">switch.cdn.fortheusers.org/repo.json</a></li>
          </ul>
        </p>
        <p className="pNormalWidth">
          {t("repositoryExplanation")}
        </p><p className="pNormalWidth">
          <Trans i18nKey="changeNotification">
            <a href="https://bsky.app/profile/hb-app.store">Bluesky</a>
            <a href="https://discord.gg/F2PKpEj">Discord</a>
            <a href="https://github.com/fortheusers/libget/wiki/Using-repogen.py">repogen.py</a>
            <a href="https://github.com/fortheusers/spinarak">spinarak</a>
            <code>repo.json</code>
          </Trans>
        </p>
        <p className="pNormalWidth">
          <Trans i18nKey="commandUsage">
            <a href="https://curl.se/">curl</a>
            <a href="https://stedolan.github.io/jq/">jq</a>
          </Trans>
        </p>
        {t("targetRepo")}&nbsp;&nbsp;
        <select
          onChange={event => this.setState({curRepo: event.target.value})}
          style={{backgroundImage: `url(${dropDownCarat})`, color: "unset"}}>
          <option value={WIIU_CDN}>{t("wiiu")}</option>
          <option value={SWITCH_CDN}>{t("switch")}</option>
        </select>
        <details className="pNormalWidth">
          <summary><h3>{t("listingPackages")}</h3></summary>
          <Trans i18nKey="packageMetadata">
            <code>packages</code>
          </Trans>
          <pre class="promptSnippet">
            curl <strong>{curRepo}</strong> | jq <strong>'.packages'</strong>
          </pre>
          {t("response")}
          <pre class="responseSnippet">
            {JSON.stringify(packages, null, 2)}
          </pre>
        </details>
        <details className="pNormalWidth">
          <summary><h3>{t("listingAuthorPackages")}</h3></summary>
          <Trans i18nKey="authorFilter">
            <code>packages</code>
            <code>jq</code>
            <code>author</code>
          </Trans>
          <pre class="promptSnippet">
            curl <strong>{curRepo}</strong> | jq '.packages | map(select(<strong>.author == "vgmoose"</strong>))'
          </pre>
          {t("response")}
          <pre class="responseSnippet">
            {JSON.stringify(packages.filter(pkg => pkg.author === "vgmoose"), null, 2)}
          </pre>
        </details>
        <details className="pNormalWidth">
          <summary><h3>{t("listingCategoryPackages")}</h3></summary>
          <Trans i18nKey="categoryFilter">
            <code>jq</code>
            <code>category</code>
          </Trans>
          <pre class="promptSnippet">
            curl <strong>{curRepo}</strong> | jq '.packages | map(select(<strong>.category == "game"</strong>))'
          </pre>
          {t("response")}
          <pre class="responseSnippet">
            {JSON.stringify(packages.filter(pkg => pkg.category === "game"), null, 2)}
          </pre>
        </details>
        {t("targetPackage")}&nbsp;&nbsp;
        <select
          onChange={event => this.setState({curPackage: event.target.value})}
          style={{backgroundImage: `url(${dropDownCarat})`, color: "unset"}}
          id="packageSelect"
          >
            {[...packages].sort((a, b) => a.title.localeCompare(b.title)).map(pkg => <option value={pkg.name}>{pkg.title}</option>)}
        </select>
        <details className="pNormalWidth">
          <summary><h3>{t("singlePackageInfo")}</h3></summary>
          <Trans i18nKey="packageIdentifier">
            <code>name</code>
            <code>name</code>
            <code>title</code>
          </Trans>
          <br/><br/>
          <Trans i18nKey="packageSearch">
            <code>name</code>
          </Trans>
          <pre class="promptSnippet">
            curl {curRepo} | jq '.packages | map(select(<strong>.name == "{curPackage}"</strong>))<strong>[0]</strong>'
          </pre>
          {t("response")}
          <pre class="responseSnippet">
            {JSON.stringify(packages.find(pkg => pkg.name === `${curPackage}`) || {}, null, 2)}
          </pre>
        </details>
        <details className="pNormalWidth">
          <summary><h3>{t("downloadingPackage")}</h3></summary>
          <Trans i18nKey="packageDownload">
            <code>name</code>
            <code>/zips/<strong>[name]</strong>.zip</code>
          </Trans>
          <br/><br/>
          {t("visitUrlNotice")}
          <pre class="promptSnippet">
            curl -O {repoBase}<strong>/zips/{curPackage}.zip</strong>
          </pre>
          {t("response")} <Trans i18nKey="downloadResponse">
            <a href={`${repoBase}/zips/${curPackage}.zip`}>{curPackage}.zip</a>
          </Trans>
          <br/><br/>
        </details>
        <details className="pNormalWidth">
          <summary><h3>{t("packageImageAssets")}</h3></summary>
          <Trans i18nKey="packageIcon">
            <code>name</code>
          </Trans>
          <pre class="promptSnippet">
            curl -O {repoBase}<strong>/packages/{curPackage}/icon.png</strong>
          </pre>
          {t("response")}<br/>
          <a href={`${repoBase}/packages/${curPackage}/icon.png`}><img alt="example icon" src={`${repoBase}/packages/${curPackage}/icon.png`} /></a>
          <br/><br/>
          <Trans i18nKey="bannerInfo">
            <code>screen.png</code>
          </Trans>
          <br/>
          <pre class="promptSnippet">
            curl -O {repoBase}<strong>/packages/{curPackage}/screen.png</strong>
          </pre>
          {t("response")}<br/>
          <a href={`${repoBase}/packages/${curPackage}/screen.png`}><img style={{maxHeight: 200}} alt="example banner" width="100%" src={`${repoBase}/packages/${curPackage}/screen.png`} /></a>
          <br/><br/>
          </details>
        <details className="pNormalWidth">
          <summary><h3>{t("downloadingScreenshots")}</h3></summary>
          <Trans i18nKey="screenshotsInfo">
            <code>screens</code>
          </Trans>
          <pre class="promptSnippet">
          export SCREENS_COUNT=$(curl {curRepo} | jq '.packages | map(select(.name == "{curPackage}"))[0].screens')
          </pre>
          {t("screenshotsDownload")}<br/>
          <pre class="promptSnippet">
          curl --remote-name-all {repoBase}<strong>/packages/{curPackage}/screen{`{1..$SCREENS_COUNT}`}.png</strong>
          </pre>
          {t("response")} {
            screensArray.map(screenIdx => {
              const imgURL = `${repoBase}/packages/${curPackage}/screen${screenIdx + 1}.png`;
              return <div><a href={imgURL}><img width="100%" src={imgURL} alt={`screen${screenIdx + 1}`} /></a></div>;
            })
          }
        </details>
        <p className="pNormalWidth">
          <Trans i18nKey="questions">
            <a href="https://discord.gg/F2PKpEj">Discord</a>
          </Trans>
        </p>
        <p className="pNormalWidth">
          <Trans i18nKey="additionalInfo">
            <a href="https://github.com/fortheusers/libget/wiki/Overview-&-Glossary">libget wiki</a>
            <a href="https://github.com/fortheusers/libget/wiki/Overview-&-Glossary#manifests">Manifests</a>
          </Trans>
        </p>
        <p className="pNormalWidth">
          <Trans i18nKey="libgetWiki">
            <a href="https://github.com/fortheusers/libget/wiki/Packages-and-Package-Structure">an easy way</a>
            <code>pkgbuild.json</code>
            <a href="https://gitlab.com/4TU/spinarak">Spinarak</a>
            <a href="https://github.com/fortheusers/switch-hbas-repo">switch-hbas-repo</a>
          </Trans>
        </p>
        
        <br/><br/><br/><br/><br/><br/><br/><br/>
      </div>;
    } else if (location === "/submit-or-request") {
      pageText = <div>
        <h1><Trans i18nKey="submitOrRequestAnApp" /></h1>
        <p className="pNormalWidth">
          <Trans i18nKey="packagesDistributed" />
        </p>
        <p className="pNormalWidth">
          <Trans i18nKey="readyToSubmit" /> <a href="https://submit.fortheusers.org">submit.fortheusers.org</a>.&nbsp;
          <Trans i18nKey="metadataRepo">
            <a href="https://github.com/fortheusers/switch-hbas-repo">metadata repo</a>
          </Trans>&nbsp;
          <Trans i18nKey="specificInfo">
            <a href="/api-info"><Trans i18nKey="apiPageLink" />API Page</a>
          </Trans>
        </p>
        <p className="pNormalWidth">
          <strong><Trans i18nKey="pleaseNote" /></strong> <Trans i18nKey="termAppUsed"><a href="/switch/ebooks"><Trans i18nKey="ebooksLink" />eBooks</a></Trans>
        </p>
        <h3><Trans i18nKey="guidelines" /></h3>
        <p className="pNormalWidth">
          <Trans i18nKey="requirementsForApps" />
          <ul>
            <li><strong><Trans i18nKey="openSource" /></strong> - <Trans i18nKey="listedAppsMust" /></li>
            <li><strong><Trans i18nKey="noPiracy" /></strong> - <Trans i18nKey="homebrewIsAHobbyist" /> <a href="https://en.wikipedia.org/wiki/Video_game_piracy"><Trans i18nKey="videoGamePiracyLink" /></a>.</li>
            <li><strong><Trans i18nKey="permission" /></strong> - <Trans i18nKey="authorsOfApps" /></li>
            <li><strong><Trans i18nKey="dontBreakStuff" /></strong> - <Trans i18nKey="appsShouldNotBe" /></li>
          </ul>
        </p>
        <h3><Trans i18nKey="suggestions" /></h3>
        <p className="pNormalWidth">
          <Trans i18nKey="concernsNotStrictlyRequired" />
          <ul>
            <li><strong><Trans i18nKey="stability" /></strong> - <Trans i18nKey="appsShouldBeReliable" /></li>
            <li><strong><Trans i18nKey="usability" /></strong> - <Trans i18nKey="appsShouldBeEasy" /></li>
            <li><strong><Trans i18nKey="purposeful" /></strong> - <Trans i18nKey="appShouldServe" /></li>
            <li><strong><Trans i18nKey="appropriate" /></strong> - <Trans i18nKey="appsShouldNotContain" /></li>
          </ul>
        </p>
        <h3><Trans i18nKey="assetInfo" /></h3>
        <p className="pNormalWidth">
          <Trans i18nKey="ifGoodIconNotProvided" />
          <ul>
            <li><strong><Trans i18nKey="icon" /></strong> - <Trans i18nKey="squareImageThatRepresents" /></li>
            <li><strong><Trans i18nKey="screenshots" /></strong> - <Trans i18nKey="multipleFullscreenCaptures" /></li>
            <li><strong><Trans i18nKey="banner" /></strong> - <Trans i18nKey="wideRectangleToBeDisplayed" /></li>
          </ul>
        </p>
        <h3><Trans i18nKey="finalNotes" /></h3>
        <p className="pNormalWidth">
          <Trans i18nKey="notAllAppsOnOurRepositories" />
        </p>
        <p className="pNormalWidth">
          <Trans i18nKey="ifYouHaveAnyQuestions" /> <a href="https://discord.gg/F2PKpEj">Discord</a>. <Trans i18nKey="otherwiseWhenYouAreReady" /> <a href="https://submit.fortheusers.org">submit.fortheusers.org</a>.
        </p>
        <p className="pNormalWidth">
          <strong><Trans i18nKey="thankYouForYourInterest" /></strong>
        </p>
        <br/><br/><br/><br/><br/><br/><br/><br/>
      </div>;
    } else if (location === "/dmca-request" || location === "/request-takedown") {
      const allPackages = this.state.allPackages;

      pageText = <div style={{maxWidth: "100%"}}>
        <h1><Trans>removalDMCARequest</Trans></h1>
        <p className="pNormalWidth"><Trans>p1</Trans></p>
        <p className="pNormalWidth"><Trans>p2</Trans></p>
        <br/>
        <form action="https://formspree.io/f/mdoqoezp" method="POST">
          <label>
            <p><Trans>packageName</Trans></p>
            <select name="package" style={{maxWidth: "100%"}}>
              <option>{t("selectPackage")}</option>
              {allPackages.map(pkg => (<option value={pkg.name}>{pkg.title} - ({pkg.platform}/{pkg.name})</option>))}
              <option value="other">{t("otherMultipleExplained")}</option>
            </select>
          </label>
          <br/><br/>
          <label name="email">
            <p><Trans>contactEmail</Trans></p>
            <input type="email" name="email" style={{width: 300}} />
          </label>
          <br/><br/>
          <p><Trans>authorOrRepresentative</Trans></p>
          <input type="checkbox" name="authorization" value="author" /> <Trans>yes</Trans><br/>
          <input type="checkbox" name="authorization" value="authorized" /> <Trans>no</Trans><br/>
          <input type="checkbox" name="authorization" value="other" /> <Trans>other</Trans>
          <br/><br/>
          <label name="reason">
            <p><Trans>explanationAndRelevantInfo</Trans></p>
            <textarea name="reason" style={{
              width: 600,
              height: "200px",
              maxWidth: "100%"
            }} />
          </label>
          <br/><br/>
          <input type="submit" value={t("submit")} />
        </form>
        <br/><br/><br/><br/><br/><br/><br/><br/>
        </div>;
    }

    return (
      <div className="AppList">
        <Mobile />
        { pageText }
        <Spacer />
      </div>
    );
  }
}

function genHBASCreditsHTML(credits) {
  // copy-pasta'd from https://github.com/fortheusers/hb-appstore/blob/main/gui/AboutScreen.cpp
  // TODO: have a single end point that serves this info over JSON, for both web and app clients

  // argument order:
	// username, githubId, twitter, github, gitlab, patreon, url, discord, directAvatarURL
	// only first two social points will be used

  let out = "";

  const credHead = (title, desc) => {
    out += `<br/><h4>${title}</h4><p>${desc}</p>`;
  }

  const parseMastodonUrl = (url) => {
    const mastodonUrl = "https://mastodon.social/";
    if (!url) return mastodonUrl;
    let parts = url.split("@");
    if (parts && parts[0] === "") parts = parts.slice(1);
    if (parts.length !== 2) return mastodonUrl;
    return `https://${parts[1]}/@${parts[0]}`;
  }

  const createCredit = ({name, githubId, twitter, github, gitlab, patreon, url, discord, directAvatarURL, youtube, bsky, mastodon}) => {
    let socials = [];
    if (patreon) socials.push(`<a href="https://patreon.com/${patreon}"><img src="${patreonImg}" />${patreon}</a>`);
    if (github) socials.push(`<a href="https://github.com/${github}"><img src="${githubImg}" />${github}</a>`);
    if (gitlab) socials.push(`<a href="https://gitlab.com/${gitlab}"><img src="${gitlabImg}" />${gitlab}</a>`);
    if (url) socials.push(`<a href="https://${url}"><img src="${urlImg}" />${url}</a>`);
    if (bsky) socials.push(`<a href="https://bsky.app/profile/${bsky}"><img src="${bskyImg}" />${bsky}</a>`);
    if (mastodon) socials.push(`<a href="${parseMastodonUrl(mastodon)}"><img src="${mastodonImg}" />${mastodon}</a>`);
    if (twitter) socials.push(`<a href="https://twitter.com/${twitter}"><img src="${twitterImg}" />${twitter}</a>`);
    if (youtube) socials.push(`<a href="https://youtube.com/@${youtube}"><img src="${youtubeImg}" />${youtube}</a>`);
    if (discord) socials.push(`<a href="https://discord.com"><img src="${discordImg}" />${discord}</a>`);
    socials = socials.slice(0, 2); // only use the first two
    out += `<div class="singleCredit"><a ${github ? `href="https://github.com/${github}"` : ""}><img class="avatar" style="width:75px; height:75px; border-radius: 10px" src="${directAvatarURL || `https://avatars.githubusercontent.com/u/${githubId}?v=4`}"/></a><div class="socials"><span class="name">${name}</span>`;
    out += socials.join("");
    out += `</div></div>`;
  }

  // pull in the credits from the metarepo
  for (let credit of credits) {
    const { section, details, users } = credit;
    credHead(section, details);
    for (let user of users) {
      createCredit(user);
    }
  }

  return out;
}

export default withTranslation()(InfoPage);

// https://www.30secondsofcode.org/js/s/levenshtein-distance/
const levenshtein = (s, t) => {
  if (!s.length) return t.length;
  if (!t.length) return s.length;
  const arr = [];
  for (let i = 0; i <= t.length; i++) {
    arr[i] = [i];
    for (let j = 1; j <= s.length; j++) {
      arr[i][j] =
        i === 0
          ? j
          : Math.min(
              arr[i - 1][j] + 1,
              arr[i][j - 1] + 1,
              arr[i - 1][j - 1] + (s[j - 1] === t[i - 1] ? 0 : 1)
            );
    }
  }
  return arr[t.length][s.length];
};
