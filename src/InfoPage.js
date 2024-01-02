import React, { Component, Fragment } from 'react';
import { Spacer, Mobile } from './Utils';
import AppList from './AppList';
import twitterImg from './img/twitter.png';
import githubImg from './img/github.png';
import gitlabImg from './img/gitlab.png';
import patreonImg from './img/patreon.png';
import discordImg from './img/discord.png';
import youtubeImg from './img/youtube.png';
import urlImg from './img/url.png';
import bskyImg from './img/bsky.png';
import switchImg from './img/switch.png';
import wiiuImg from './img/wiiu.png';

class InfoPage extends Component {

  state = {
    allPackages: []
  }

  async componentDidMount() {
    const location = window.location.pathname;

    if (location === "/about" || location === '/dmca-request') {
      let allPackages = await AppList.fetchPackages();
      allPackages.sort((a, b) => a.title.localeCompare(b.title));
      this.setState({ allPackages })
    }
  }

  render() {
    let pageText = <div>
      You are (probably) being redirected.
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
          authors.push(...author.split(" and "));
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

      let hbasCreditsHTML = genHBASCreditsHTML();
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
        <h1>About hb-appstore</h1>
        <p className="pNormalWidth">
          Homebrew App Store is a free and open-source repository of <a href="https://en.wikipedia.org/wiki/Homebrew_(video_games)">homebrew apps</a> for the Wii U and Switch consoles. This listing is maintained by the <a href="https://fortheusers.org">ForTheUsers team</a>, with the goal of making accessible and preserving the efforts of independent developers and hobbyists to end users.
        </p><p className="pNormalWidth">
          If you would like to list your own open-source app here, or request an existing one to add to this index, please see the <a href="/submit-or-request">Submit</a> page. For already listed apps, an <a href="/api-info">API</a> is available.
        </p>
        <p className="pNormalWidth">
          If you are a copyright holder and are concerned some of your work is being infringed upon, please fill out this <a href="/dmca-request">DMCA Form</a> to submit a takedown request. This also applies if you are an open-source developer and don't want us to distribute your project here.
        </p>
        <h3>How It Works</h3>
        <p className="pNormalWidth">
         The content in our repositories is available both as a website and as a <a href="https://github.com/fortheusers/hb-appstore">native homebrew app</a> for the Wii U and Switch consoles. These console apps try to provide a similar experience to using a web browser, and can be downloaded <a href="https://github.com/fortheusers/hb-appstore/releases">here</a>.
        </p>
        <p className="pNormalWidth">
          The individual hosted packages are updated regularly with new apps and updates. These are maintained by ForTheUsers staff and volunteers from the community. If you would like to help or report and outdated package, please contact us on <a href="https://discord.gg/F2PKpEj">Discord</a>.
        </p>
        <p style={{marginTop: -40}} className="pNormalWidth creditsContainer" dangerouslySetInnerHTML={{__html: hbasCreditsHTML}}>
        </p>
        <h3>App Authors</h3>
        <p className="pNormalWidth">
          Of course, this project wouldn't exist without the developers of the apps themselves.  Thank you to all of the developers who have contributed to the homebrew community!
          <br/><br/>
          {authorList}
        </p>

        <h3>Donations</h3>
        <p className="pNormalWidth">
          Thank you for your interest in supporting this project!  We are not accepting donations, but if you would like to support the developers of the apps listed here, please visit their respective Github pages or websites as listed above.
        </p>
        <p className="pNormalWidth">
          Otherwise, if you are still interested in supporting the project directly, we can recommend that you consider looking into and donating to one of the following causes instead:
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
        <h3>Licensing Info</h3>
        <p className="pNormalWidth">
          This website and the console clients are licensed under the <a href="https://www.gnu.org/licenses/gpl-3.0.en.html">GPLv3</a>. The content on the repositories we host is also available to use under a <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.en">CC-BY-SA license</a>.
        </p>
        <p className="pNormalWidth">
          That's pretty much everything! For other questions, reach out to one of the developers listed above, or join our <a href="https://discord.gg/F2PKpEj">Discord</a> server.
        </p>
        <br/><br/><br/><br/><br/><br/><br/><br/><br/>
      </div>;
    } else if (location === "/api-info") {
      window.location.href = "https://github.com/fortheusers/libget/wiki/Overview-&-Glossary#repos";
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

function genHBASCreditsHTML() {
  // copy-pasta'd from https://github.com/fortheusers/hb-appstore/blob/main/gui/AboutScreen.cpp
  // TODO: have a single end point that serves this info over JSON, for both web and app clients

  // argument order:
	// username, githubId, twitter, github, gitlab, patreon, url, discord, directAvatarURL
	// only first two social points will be used

  let out = "";

  const credHead = (title, desc) => {
    out += `<br/><h4>${title}</h4><p>${desc}</p>`;
  }

  const credit = (name, githubId, twitter, github, gitlab, patreon, url, discord, directAvatarURL, youtube, bsky) => {
    out += `<div class="singleCredit"><a href="https://github.com/${github}"><img class="avatar" style="width:75px; height:75px; border-radius: 10px" src="${directAvatarURL || `https://avatars.githubusercontent.com/u/${githubId}?v=4`}"/></a><div class="socials"><span class="name">${name}</span>`;
    if (twitter) out += `<a href="https://twitter.com/${twitter}"><img src="${twitterImg}" />${twitter}</a>`;
    if (github) out += `<a href="https://github.com/${github}"><img src="${githubImg}" />${github}</a>`;
    if (gitlab) out += `<a href="https://gitlab.com/${gitlab}"><img src="${gitlabImg}" />${gitlab}</a>`;
    if (patreon) out += `<a href="https://patreon.com/${patreon}"><img src="${patreonImg}" />${patreon}</a>`;
    if (discord) out += `<a href="https://discord.com"><img src="${discordImg}" />${discord}</a>`;
    if (url) out += `<a href="https://${url}"><img src="${urlImg}" />${url}</a>`;
    if (youtube) out += `<a href="${youtube}"><img src="${youtubeImg}" />${youtube}</a>`;
    if (bsky) out += `<a href="https://bsky.app/profile/${bsky}"><img src="${bskyImg}" />${bsky}</a>`;
    out += `</div></div>`;
  }

	credHead("Repo Maintenance and Development", "These are the primary people responsible for actively maintaining and developing the Homebrew App Store. If there's a problem, these are the ones to get in touch with!");
	credit("pwsincd", "20027105", null, "pwsincd", null, null, null, "pwsincd");
	credit("VGMoose", "2467473", null, "vgmoose", null, null, null, null, null, null, "vgmoose.dev");
	credit("Nightkingale", "63483138", "Nightkingale", "nightkingale");
	credit("rw-r-r_0644", "18355947", "rw_r_r_0644", "rw-r-r-0644");
	credit("crc32", "7893269", null, "crc-32");
	credit("CompuCat", "12215288", null, null, "compucat", null, "compucat.me");
	credit("Quarky", "8533313", null, null, "quarktheawesome", null, "heyquark.com");

	credHead("Library Development and Support", "Without the contributions to open-source libraries and projects by these people, much of the functionality within this program wouldn't be possible.");
	credit("Maschell", "8582508", "maschelldev", "maschell");
	credit("brienj", "17801294", "xhp_creations", "xhp-creations");
	credit("Dimok", "15055714", null, "dimok789");
	credit("GaryOderNichts", "12049776", "GaryOderNichts", "GaryOderNichts");
	credit("FIX94", "12349638", null, "FIX94", null, null, null, "FIX94#3446");
	credit("Zarklord", "1622280", "zarklore", "zarklord");
	credit("CreeperMario", "15356475", "CreeperMario258", "CreeperMario");
	credit("Ep8Script", "27195853", "ep8script", "ep8script");

	credHead("Music and Sound", "In the Wii U and Switch releases, these guys provide the chiptune melodies that play in the background. They make the app feel more alive, and are all-around awesome!");
	credit("(T-T)b", "40721862", "ttbchiptunes", null, null, null, "t-tb.bandcamp.com", null, "https://f4.bcbits.com/img/a2723574369_16.jpg");
	credit("drewinator4", "40721862", null, null, null, null, null, null, "https://i.ytimg.com/vi/Tb02CNlhkPA/hqdefault.jpg", "drewinator4");

	credHead("Interface Development and Design", "In one way or another, everyone in this category provided information regarding core functionality, quality-of-life changes, or the design of the user interface.");
	credit("exelix", "13405476", "exelix11", "exelix11");
	credit("Xortroll", "33005497", null, "xortroll", null, "xortroll");
	credit("Ave", "584369", null, null, "a", null, "ave.zone", null, "https://gitlab.com/uploads/-/system/user/avatar/584369/avatar.png");
	credit("LyfeOnEdge", "26140376", null, "lyfeonedge", null, null, null, "Lyfe#1555");
	credit("Román", "57878194", null, null, null, null, null, "Román#6630");
	credit("Jaames", "9112876", "rakujira", "jaames");
	credit("Jacob", "12831497", null, "jacquesCedric");
	credit("iTotalJustice", "47043333", null, "iTotalJustice");

	credHead("Toolchain and Environment", "The organizations and people in this category enable Homebrew in general by creating and maintaining a cohesive environment for the community.");
	credit("devkitPro", "7538897", null, "devkitPro", null, "devkitPro");
	credit("Wintermute", "101194", null, "wintermute", null, null, "devkitPro.org");
	credit("Fincs", "581494", "fincsdev", "fincs");
	credit("yellows8", "585494", "yellows8");
	credit("ReSwitched", "26338222", null, "reswitched", null, null, "reswitched.github.io");
	credit("exjam", "1302758", null, "exjam");
	credit("brett19", "1621627", null, "brett19");

	credHead("Homebrew Community Special Thanks", "Awesome people within the community whose work, words, or actions in some way inspired this program to exist in the manner it does.");

	credit("Whovian9369", "5240754", null, null, "whovian9369");
	credit("FIX94", "12349638", null, "FIX94");
	credit("dojafoja", "15602819", null, "dojafoja");
	credit("misson20000", "616626", null, "misson20000", null, null, null, "misson20000#0752");
	credit("roblabla", "1069318", null, "roblabla", null, null, null, "roblabla#8145");
	credit("tomGER", "25822956", "tumGER", "tumGER");
	credit("sirocyl", "944067", "sirocyl", "sirocyl");
	credit("m4xw", "13141469", "m4xwdev", "m4xw");
	credit("vaguerant", "5259025", null, "vaguerant");
	credit("Koopa", "13039555", "CodingKoopa", "CodingKoopa");
	credit("Nikki", "3280345", "NWPlayer123", "NWPlayer123");
	credit("shchmue", "7903403", null, "shchmue");
	credit("CTCaer", "3665130", "CTCaer", "CTCaer");
	credit("SciresM", "8676005", "SciresM", "SciresM");
	credit("Shinyquagsire", "1224096", "shinyquagsire", "shinyquagsire23");
	credit("Marionumber1", "775431", "MrMarionumber1");
	credit("jam1garner", "8260240", null, "jam1garner", null, null, "jam1.re");

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
