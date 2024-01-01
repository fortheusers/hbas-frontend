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
      This page intentionally left blank.
    </div>;

    const location = window.location.pathname;

    if (location === "/about") {

      let authorSet = new Set(); // unique list of all lowercase authors
      let authorGithubMap = {}; // lowercased author name -> github url
      let authorNameMap = {}; // lowercased author name -> proper caps author name
      let hbasPageMap = {}; // lowercased author name -> array of hbas page urls
      for (let pkg of this.state.allPackages) {
        if (pkg.author) {
          let authorLower = pkg.author.toLowerCase().replaceAll("_", "-");
          authorSet.add(authorLower);
          if (pkg.url && pkg.url.startsWith("https://github.com")) {
            let github = pkg.url.split("/").slice(0, 4).join("/");
            authorGithubMap[authorLower] = github;
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

      // go through our author list and split out names that are actually multiple authors
      // this is a bit of a hack, but it's better than not doing it
      for (let author of authorSet) {
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
        authorSet.delete(author);
        // add each new author
        for (let newAuthor of authors) {
          authorSet.add(newAuthor);
          // if we don't have a github url for this author, but we do for the original author, copy it over
          if (!authorGithubMap[newAuthor]) {
            authorGithubMap[newAuthor] = authorGithubMap[author];
          }
          authorNameMap[newAuthor] = newAuthor;
          if (!hbasPageMap[newAuthor]) {
            hbasPageMap[newAuthor] = [];
          }
          hbasPageMap[newAuthor].push(...hbasPageMap[author]);
        }
      }

      // remove everyone that we are already crediting
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
        <p style={{width: 700}}>
          Homebrew App Store is a free and open-source repository of <a href="https://en.wikipedia.org/wiki/Homebrew_(video_games)">homebrew apps</a> for the Wii U and Switch consoles. The apps, tools, and games distributed here are all made by independent software developers within the community.
        </p><p style={{width: 700}}>
          If you would like to list your own open-source app here, or request an existing one to add to this index, please see the <a href="/submit-or-request">Submit</a> page.
        </p>
        <p style={{width: 700}}>
          If you are a copyright holder and are concerned some of your work is being infringed upon, please fill out this <a href="/dmca-request">DMCA Form</a> to submit a takedown request. This also applies if you are an open-source developer and don't wish us to distribute your project here.
        </p>
        <h3>Our Packages</h3>
        <p style={{width: 700}}>
          The packages hosted in this repository are updated regularly with new apps and updates to existing apps. This is accomplished by our maintainers, who are ForTheUsers staff and volunteers from the community. If you would like to help or report and outdated package, please contact us on <a href="https://discord.gg/F2PKpEj">Discord</a>.
        </p>
        <p style={{width: 700}}>
         The source code for this website is available <a href="https://github.com/fortheusers/hbas-frontend">on Github</a>. To learn more about the repositories that power this site, please see the <a href="/api-info">API Info</a> page.
        </p>
        <h3>Donations</h3>
        <p style={{width: 700}}>
          Thank you for your interest in supporting this project!  We are not currently accepting donations, but if you would like to support the developers of the apps listed here, please visit their respective Github pages or websites.
        </p>
        <p style={{width: 700}}>
          Otherwise, we can recommend that you consider donating to one of the following causes:
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
        <h3>Credits</h3>
        <p style={{width: 700}}>
          This website is maintained by <a href="https://fortheusers.org">ForTheUsers</a>, and is made possible by the following open-source developers:
          <br/>
          <div className="creditsContainer" dangerouslySetInnerHTML={{__html: hbasCreditsHTML}}>
          </div>
          <br/>
          <h4>App Authors</h4>
          <p style={{width: 700}}>
            Of course, this project wouldn't exist without the developers of the apps themselves.  Thank you to all of the developers who have contributed to the homebrew community!
            <br/><br/>
            {authorList}
          </p>

        </p>
        <br/><br/><br/><br/><br/><br/><br/><br/><br/>
      </div>;
    } else if (location === "/api-info") {
      window.location.href = "https://github.com/fortheusers/libget/wiki/Overview-&-Glossary#repos";
    } else if (location === "/submit-or-request") {
      window.location.href = "https://submit.fortheusers.org/";
    } else if (location === "/dmca-request") {
      const allPackages = this.state.allPackages;

      pageText = <div>
        <h1>Removal / DMCA Request</h1>
        <p style={{width: 700}}>
          If you are the author of an app within our repositories, or represent a copyright holder and have concerns that your work or rights are infringed upon, please submit a removal or DMCA request below.  Our goal is to honor all rights related to intellectual property, and we strive to respond swiftly to any related concerns.
        </p>
        <p style={{width: 700}}>
          The packages that are provided for download on this website are by homebrew developers in the community, are submitted by volunteer users or the developers themselves, and are intended to be distributed under their respective open-source licenses.
        </p>
        <br/>
        <form
          action="https://formspree.io/f/mdoqoezp"
          method="POST"
        >
          <label>
            <p>Package name:</p>
            <select name="package">
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
              height: "200px"
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
    out += `<div class="singleCredit"><img class="avatar" style="width:75px; height:75px; border-radius: 10px" src="${directAvatarURL || `https://avatars.githubusercontent.com/u/${githubId}?v=4`}"/><div class="socials"><span class="name">${name}</span>`;
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
	credit("crc32", "7893269", "crc32_", "crc-32");
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
