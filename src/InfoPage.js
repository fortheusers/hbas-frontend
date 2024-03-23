import React, { Component, Fragment } from 'react';
import { Trans } from 'react-i18next';

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
            <a href="/dmca-request">DMCA Page</a>
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
        <h1>API Info</h1>
        <p className="pNormalWidth">
          This website (<a href="https://hb-app.store">hb-app.store</a>) is a web frontend to access the packages in our repositories. Both the <a href="https://github.com/fortheusers/hb-appstore">console app</a> and <a href="https://gitlab.com/4TU/hbas-frontend/">this site</a> are open-source clients that access these repos using our API.
        </p>
        <p className="pNormalWidth">
          The two main repositories used by this project are:
          <ul>
            <li><img src={wiiuImg} style={{width: 24, verticalAlign: "middle", marginRight: 10 }} alt="Wii U" /><a href="https://wiiu.cdn.fortheusers.org/repo.json">wiiu.cdn.fortheusers.org/repo.json</a></li>
            <li><img src={switchImg} style={{width: 24, verticalAlign: "middle", marginRight: 10 }} alt="Switch" /><a href="https://switch.cdn.fortheusers.org/repo.json">switch.cdn.fortheusers.org/repo.json</a></li>
          </ul>
        </p>
        <p className="pNormalWidth">
          A repository is a JSON file that contains a list of all the packages in the repository, along with their metadata. The repo content is updated by our build script whenever 4TU staff adds or updates the contents of a package.
        </p><p className="pNormalWidth">When changes are made to the repos, a message is posted in <code>#hbas-updates</code> on our <a href="https://discord.gg/F2PKpEj">Discord</a>. The build script used to accomplish this is <a href="https://github.com/fortheusers/libget/wiki/Using-repogen.py">libget's repogen.py</a>, which turns a locally maintained directory of files for each package into compressed zip files and a <code>repo.json</code> file.
        </p>
        <p className="pNormalWidth">
          The below commands use <a href="https://curl.se/">curl</a> and <a href="https://stedolan.github.io/jq/">jq</a> to parse the JSON output. If you don't have these installed, you can any HTTP client and JSON parser of your choice.
        </p>
        Target Repo for Examples:&nbsp;&nbsp;
        <select
          onChange={event => this.setState({curRepo: event.target.value})}
          style={{backgroundImage: `url(${dropDownCarat})`, color: "unset"}}>
          <option value={WIIU_CDN}>Wii U</option>
          <option value={SWITCH_CDN}>Switch</option>
        </select>
        <details className="pNormalWidth">
          <summary><h3>Listing all packages</h3></summary>
          Package metadata is stored in an array underneath the root-level <code>packages</code> key.
          <pre class="promptSnippet">
            curl <strong>{curRepo}</strong> | jq <strong>'.packages'</strong>
          </pre>
          Response:
          <pre class="responseSnippet">
            {JSON.stringify(packages, null, 2)}
          </pre>
        </details>
        <details className="pNormalWidth">
          <summary><h3>Listing packages from a specific author</h3></summary>
          The <code>packages</code> array can be filtered by any of its attributes. The below example uses <code>jq</code> to filter the array by <code>author</code>.
          <pre class="promptSnippet">
            curl <strong>{curRepo}</strong> | jq '.packages | map(select(<strong>.author == "vgmoose"</strong>))'
          </pre>
          Response:
          <pre class="responseSnippet">
            {JSON.stringify(packages.filter(pkg => pkg.author === "vgmoose"), null, 2)}
          </pre>
        </details>
        <details className="pNormalWidth">
          <summary><h3>Listing all packages in a category</h3></summary>
          Likewise, a category can be used to filter the array. The below example uses <code>jq</code> to filter the array by <code>category</code>.
          <pre class="promptSnippet">
            curl <strong>{curRepo}</strong> | jq '.packages | map(select(<strong>.category == "game"</strong>))'
          </pre>
          Response:
          <pre class="responseSnippet">
            {JSON.stringify(packages.filter(pkg => pkg.category === "game"), null, 2)}
          </pre>
        </details>
        Target Package for Examples:&nbsp;&nbsp;
        <select
          onChange={event => this.setState({curPackage: event.target.value})}
          style={{backgroundImage: `url(${dropDownCarat})`, color: "unset"}}
          id="packageSelect"
          >
            {[...packages].sort((a, b) => a.title.localeCompare(b.title)).map(pkg => <option value={pkg.name}>{pkg.title}</option>)}
        </select>
        <details className="pNormalWidth">
          <summary><h3>Getting info on a single package</h3></summary>
          Every package in the array has a unique <code>name</code> attribute that identifies it. This short <code>name</code> is used to track updates to the package, and will not change even if the package's <code>title</code> or other metadata changes.
          <br/><br/>
          There's no specific API endpoint to get a single package, so the array needs to be searched for the package with the matching <code>name</code>.
          <pre class="promptSnippet">
            curl {curRepo} | jq '.packages | map(select(<strong>.name == "{curPackage}"</strong>))<strong>[0]</strong>'
          </pre>
          Response:
          <pre class="responseSnippet">
            {JSON.stringify(packages.find(pkg => pkg.name === `${curPackage}`) || {}, null, 2)}
          </pre>
        </details>
        <details className="pNormalWidth">
          <summary><h3>Downloading a specific package</h3></summary>
          From inspecting the metadata, once you know the <code>name</code> of a package, you can download it at <code>/zips/<strong>[name]</strong>.zip</code>.
          <br/><br/>
          This URL can also be directly visited in a browser to download the package.
          <pre class="promptSnippet">
            curl -O {repoBase}<strong>/zips/{curPackage}.zip</strong>
          </pre>
          Response: <a href={`${repoBase}/zips/${curPackage}.zip`}>{curPackage}.zip</a> in the current directory.
          <br/><br/>
          There are no restrictions on how often a package can be downloaded, but please be considerate of our bandwidth. If the service is abused, we may implement rate limiting.
        </details>
        <details className="pNormalWidth">
          <summary><h3>Getting package image assets</h3></summary>
          Using the package <code>name</code> again, URLs for the package's icon and banner can be constructed, and viewed or downloaded.
          <pre class="promptSnippet">
            curl -O {repoBase}<strong>/packages/{curPackage}/icon.png</strong>
          </pre>
          Response:<br/>
          <a href={`${repoBase}/packages/${curPackage}/icon.png`}><img alt="example icon" src={`${repoBase}/packages/${curPackage}/icon.png`} /></a>
          <br/><br/>
          The banner is a wide image that is displayed on the package's details page, but for historical reasons it's named <code>screen.png</code>.
          <br/>
          <pre class="promptSnippet">
            curl -O {repoBase}<strong>/packages/{curPackage}/screen.png</strong>
          </pre>
          Response:<br/>
          <a href={`${repoBase}/packages/${curPackage}/screen.png`}><img style={{maxHeight: 200}} alt="example banner" width="100%" src={`${repoBase}/packages/${curPackage}/screen.png`} /></a>
          <br/><br/>
          </details>
        <details className="pNormalWidth">
          <summary><h3>Downloading all screenshots for a package</h3></summary>
          The total number of available screenshots is listed in the package metadata under the <code>screens</code> attribute. First we'll get this count and store it in an env variable:
          <pre class="promptSnippet">
          export SCREENS_COUNT=$(curl {curRepo} | jq '.packages | map(select(.name == "{curPackage}"))[0].screens')
          </pre>
          Then we can use a bash expansion to download all the screenshots at once:
          <pre class="promptSnippet">
          curl --remote-name-all {repoBase}<strong>/packages/{curPackage}/screen{`{1..$SCREENS_COUNT}`}.png</strong>
          </pre>
          Response: {
            screensArray.map(screenIdx => {
              const imgURL = `${repoBase}/packages/${curPackage}/screen${screenIdx + 1}.png`;
              return <div><a href={imgURL}><img width="100%" src={imgURL} alt={`screen${screenIdx + 1}`} /></a></div>;
            })
          }
        </details>
        <p className="pNormalWidth">
          If you have any questions about these responses or the usage of this API, please contact us on <a href="https://discord.gg/F2PKpEj">Discord</a>. If you are using our repos for a project, we would love to hear about it!
        </p>
        <p className="pNormalWidth">
          For additional information on the structure of the packages, see the <a href="https://github.com/fortheusers/libget/wiki/Overview-&-Glossary">libget wiki</a>. The info there lines up with the above, but it also details <a href="https://github.com/fortheusers/libget/wiki/Overview-&-Glossary#manifests">Manifests</a>, which are used by some packages to instruct the console app on how to handle certain files within a package during an update.
        </p>
        <p className="pNormalWidth">
          The libget wiki also <a href="https://github.com/fortheusers/libget/wiki/Packages-and-Package-Structure">goes over an easy way</a> to generate and maintain your a repo, using <code>pkgbuild.json</code> files and <a href="https://gitlab.com/4TU/spinarak">Spinarak</a>. This can be convenient for self-hosting your own packages and managing updates directly to users. However, this use case is uncommon and most hb-appstore users don't add and track external repos at this time.
        </p>
        
        <br/><br/><br/><br/><br/><br/><br/><br/>
      </div>;
    } else if (location === "/submit-or-request") {
      pageText = <div style={{maxWidth: "100%"}}>
        <h1>Submit or Request an App</h1>
        <p className="pNormalWidth">
          The packages distributed in our repositories are sent in either by homebrew developers themselves or by volunteer users in the community. Please check the guidelines on this page before submitting an app for review.
        </p>
        <p className="pNormalWidth">
          When you are ready to submit, the actual form is located at <a href="https://submit.fortheusers.org">submit.fortheusers.org</a>. For specific info on how these repos are maintained, see the <a href="/api-info">API</a> page.
        </p>
        <p className="pNormalWidth">
          <strong>Please Note:</strong> The term "app" is being used for simplicity here, but a package can consist of any relevant files, such as games, mods, or configs. (Or even public domain <a href="/switch/ebooks">eBooks</a>).
        </p>
        <h3>Guidelines</h3>
        <p className="pNormalWidth">
          We try to keep the requirements for apps to be listed here as minimal as possible, but there are a few things considered when reviewing submissions:
          <ul>
            <li><strong>Open Source</strong> - Listed apps must have source code publicly available, and ideally be licensed under a permissive license such as MIT, GPL, BSD, etc.</li>
            <li><strong>No Piracy</strong> - Homebrew is a hobbyist endeavor, and as such, we do not accept apps that are intended to be used primarily for <a href="https://en.wikipedia.org/wiki/Video_game_piracy">video game piracy</a>.</li>
            <li><strong>Permission</strong> - Authors of apps should be contacted to verify that they are aware of and approve of their app being listed here.</li>
            <li><strong>Don't Break Stuff</strong> - Apps should not be malicious, or cause damage to the user's device.  This includes apps that are known to be unstable or cause crashes.</li>
          </ul>
        </p>
        <h3>Suggestions</h3>
        <p className="pNormalWidth">
          The following concerns are not strictly required, but are recommended for a better user experience:
          <ul>
            <li><strong>Stability™</strong> - Apps should be reasonably reliable, tested, and functional. Beta or in-development apps are okay, but should be clearly marked as such.</li>
            <li><strong>Usability</strong> - Likewise, apps should be relatively easy for the average user to understand, and not require extensive technical knowledge to operate.</li>
            <li><strong>Purposeful</strong> - Your app should serve a clear purpose, and try to not be redundant with other apps already listed here.</li>
            <li><strong>Appropriate</strong> - Apps should not contain excessive profanity or other offensive content. However, we also recognize that some apps may be intended for mature audiences, and will be reviewed on a case-by-case basis.</li>
          </ul>
        </p>
        <h3>Asset Info</h3>
        <p className="pNormalWidth">
          If a good icon is not provided, our staff or volunteer designers on Discord may create one. The banner and screenshots fields are more optional, but recommended.
          <ul>
            <li><strong>Icon</strong> - A square or square-ish image that represents your app.</li>
            <li><strong>Screenshots</strong> - Multiple fullscreen captures of what your app looks while running</li>
            <li><strong>Banner</strong> - A wide rectangle to be displayed on your app details page</li>
          </ul>
        </p>
        <h3>Final Notes</h3>
        <p className="pNormalWidth">
          Not all apps on our repositories have equal importance: Some are simple homebrew games, some are utilities, some are ports of existing software, and some are just silly. We try to be as inclusive as possible, but may reject a submission for any reason.
        </p>
        <p className="pNormalWidth">
          If you have any questions about the submission process, please contact us on <a href="https://discord.gg/F2PKpEj">Discord</a>.  Otherwise, when you are ready to submit, the form is located at <a href="https://submit.fortheusers.org">submit.fortheusers.org</a>.
        </p>
        <p className="pNormalWidth">
          <strong>Thank you for your interest in contributing to our repositories!</strong>
        </p>
        <br/><br/><br/><br/><br/><br/><br/><br/>
      </div>;
    } else if (location === "/dmca-request") {
      const allPackages = this.state.allPackages;

      pageText = <div style={{maxWidth: "100%"}}>
        <h1>Removal / DMCA Request</h1>
        <p className="pNormalWidth">
          If you are the author of an app within our repositories, or represent a copyright holder and have concerns that your work or rights are infringed upon, please submit a removal or DMCA request below.  Our goal is to honor all rights related to intellectual property, and we strive to respond swiftly to any related concerns.
        </p>
        <p className="pNormalWidth">
          The packages that are provided for download on this website are by homebrew developers in the community, are submitted by volunteer users or the developers themselves, and are intended to be distributed under their respective open-source licenses.
        </p>
        <br/>
        <form
          action="https://formspree.io/f/mdoqoezp"
          method="POST"
        >
          <label>
            <p>Package name:</p>
            <select name="package" style={{maxWidth: "100%"}}>
              <option>Select a package...</option>
              {allPackages.map(pkg => (<option value={pkg.name}>{pkg.title} - ({pkg.platform}/{pkg.name})</option>))}
              <option value="other">Other / Multiple / Explained in Reason</option>
            </select>
          </label>
          <br/><br/>
          <label name="email">
            <p>Contact Email:</p>
            <input type="email" name="email" style={{width: 300}} />
          </label>
          <br/><br/>
          <p>Are you the author or an authorized representative of the copyright holder?</p>
          <input type="radio" name="authorization" value="yes" /> Yes&nbsp;&nbsp;&nbsp;&nbsp;
          <input type="radio" name="authorization" value="no" /> No&nbsp;&nbsp;&nbsp;&nbsp;
          <input type="radio" name="authorization" value="other" /> Other
          <br/><br/>
          <label name="reason">
            <p>Explanation and Relevant Information:</p>
            <textarea name="reason" style={{
              width: 600,
              height: "200px",
              maxWidth: "100%"
            }} />
          </label>
          <br/><br/>
          <input type="submit" value="Submit" />
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

export default InfoPage;

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
