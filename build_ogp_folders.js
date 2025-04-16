// This script builds the OGP (Open Graph Protocol) folders for the frontend
// It does this by pulling the current state of the repos from the API, and copying
// the main HTML page into each of the nested folders.
// This means that if the repos update, the site will need to be rebuilt for newly
// added apps to have their OGP folders created.

const fs = require('fs');
const path = require('path');
const process = require('process');

const getCssEmbed = platform => {
    const platformColor = platform == "switch" ? "#d62131" : "#118ab7";
    return `<style>
        body {
            font-family: sans-serif;
            background-color: #f0f0f0;
            color: #333;
            padding: 20px;
        }
        .nojs-page {
            max-width: 800px;
            margin: 0 auto;
            background-color: #fff;
            padding: 20px;
            border-radius: 8px;
        }
        .colorbar {
            width: calc(100% + 40px);
            height: 10px;
            background-color: ${platformColor};
            margin: -20px;
            border-radius: 8px 8px 0 0;
        }
        .colorbar.purple {
            background-color:rgb(78, 65, 128);
        }
        h3 img {
            width: 30px;
            height: 30px;
            vertical-align: middle;
            margin-right: 10px;
        }
        h3 {
            padding: 10px;
            text-align: center;
        }
        h3 a {
            color: #333;
            text-decoration: none;
        }
        h3 a:hover {
            text-decoration: underline;
        }
        .app-info {
            display: flex;
            flex-wrap: wrap;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            background-color:rgb(245, 245, 245);
            border-radius: 8px;
        }
        .app-info img {
            height: 100px;
            margin-right: 20px;
            border: 1px solid #ccc;
            border-radius: 8px;
        }
        .app-info h2 {
            margin: 0;
        }
        .app-info ul {
            list-style: none;
            padding: 0;
        }
        .app-info .app-icon {
            margin-right: 20px;
            padding: 20px;
            min-width: 150px;
        }
        .app-info h2 {
            padding-bottom: 20px;
        }
        .app-info .info {
            margin: 10px;
            padding: 10px;
            background-color: #f9f9f9;
            border-radius: 8px;
        }
        .app-icon span, .info span {
            font-size: 0.8em;
            color: #666;
        }
        .info code {
            max-width: 150px;
            display: inline-block;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        table td:first-child {
            padding: 2px;
            text-align: right;
            font-weight: bold;
            vertical-align: top;
            padding-right: 15px;
        }
        .links {
            margin: 0 auto;
            width: 100%;
            text-align: center;
            padding: 10px;
        }
        .links a {
            text-decoration: none;
            padding: 10px 20px;
            font-size: 18px;
            background-color: ${platformColor};
            color: #fff;
            border-radius: 5px;
            margin-right: 10px;
        }
        .links a:hover {
            background-color: #007bff;
        }
        .screenshots {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-around;
            flex-wrap: wrap;
        }
        .screenshots img {
            max-width: 350px;
            border-radius: 8px;
            border: 4px solid transparent;
        }
        .screenshots img:hover {
            border: 4px solid #007bff;
        }
        footer {
            text-align: center;
            margin-top: 20px;
            font-size: 0.8em;
            color: #666;
        }
        footer a {
            color: #007bff;
            text-decoration: none;
        }
        footer a:hover {
            text-decoration: underline;
        }
        .description p {
            margin-left: 20px;
            margin-right: 20px;
        }
        .app-listing .app-info {
            flex-wrap: nowrap;
            justify-content: flex-start;
            border: 4px solid transparent;
        }
        .info.listing-info {
            width: 100%;
        }
        .app-listing a {
            text-decoration: none;
            color: #333;
            margin-bottom: 20px;
        }
        .app-listing .app-info:hover {
            border: 4px solid #007bff;
        }
        .app-home {
            display: flex;
            flex-direction: row;
            justify-content: center;
            align-items: center;
        }
        .app-home a {
            text-decoration: none;
            color: #333;
        }
        .app-home a:hover {
            text-decoration: underline;
        }
        .app-home .app-icon {
            text-align: center;
            margin-left: 30px;
            margin-right: 30px;
        }
        .app-home .app-icon img {
            width: 100px;
        }
        .plat {
            margin-bottom: 10px;
        }
        .intro {
            margin: 30px;
            margin-bottom: 15px;
        }
    </style>`;
}

const noscriptMarker = "<noscript>This website requires JavaScript to function.</noscript>";
const footer = `<footer>
    <a href="https://github.com/fortheusers/hbas-frontend" target="_blank">GPLv3 License.</a> This website is NOT affiliated with Nintendo Co. Ltd.
</footer>`;

const buildNoscriptHome = () => {
    return `<noscript>
    <title>Homebrew App Store</title>
    ${getCssEmbed()}
    <div class="nojs-page">
        <div class="colorbar purple"></div>
        <h3><a href="/"><img src="/icon.png" alt="App Store Icon"/>Homebrew App Store</a></h3>
        <p class="intro">
            Homebrew App Store is a free and open-source repository of homebrew apps for the Wii U and Switch consoles. The apps, tools, and games distributed here are all made by independent software developers within the community.
        </p>
        <h3 class="plat">Choose a Platform</h3>
        <div class="app-home">
            <a href="/wiiu" class="app-icon">
                <img src="/wiiu.png" alt="WiiU icon">
                <h2>Wii U<span></h2>
            </a>
            <a href="/switch" class="app-icon">
                <img src="/switch.png" alt="Switch icon">
                <h2>Switch<span></h2>
            </a>
        </div>
    </div>
    ${footer}
    </noscript>`;
};

const buildNoscriptIndex = (platform, packages) => {
    packages.sort((a, b) => {
        // convert "DD/MM/YYYY" string to unix integer
        const aDate = new Date(a.updated.split("/").reverse().join("-")).getTime();
        const bDate = new Date(b.updated.split("/").reverse().join("-")).getTime();
        return bDate - aDate;
    });
    // same as below, but for the main listing of the repo
    return `<noscript>
    <title>Homebrew App Store (${platform})</title>
    ${getCssEmbed(platform)}
    <div class="nojs-page">
        <div class="colorbar"></div>
        <h3><a href="/${platform}"><img src="/icon.png" alt="App Store Icon"/>Homebrew App Store (${platform})</a></h3>
        <div class="app-listing">
            ${packages.map(pkg => {
                return `<a href="/${platform}/${pkg.name}">
                    <div class="app-info">
                        <div class="app-icon">
                            <img src="https://${platform}.cdn.fortheusers.org/packages/${pkg.name}/icon.png" alt="${pkg.title} icon">
                        </div>
                        <div class="info listing-info">
                            <h2>${pkg.title}<span> by ${pkg.author}</span></h2>
                            <p>${pkg.description}</p>
                            <p>Version: ${pkg.version}</p>
                        </div>
                    </div>
                </a>`;
            }).join("")}
        </div>
    </div>
    ${footer}
    </noscript>`;
}

const buildNoscriptHtml = (platform, package) => {
    // this method will create a barebones HTML version of the page that will only be displayed when JS is disabled
    let screenshotInfo = "";
    if (package.screens) {
        screenshotInfo += `<h4>Screenshots</h4><div class="screenshots">`;
        for (let x=0; x<package.screens; x++) {
            const screenUrl = `https://${platform}.cdn.fortheusers.org/packages/${package.name}/screen${x+1}.png`;
            screenshotInfo += `<a target="_blank" href="${screenUrl}"><img src="${screenUrl}" alt="Screenshot"></a>`;
        }
        screenshotInfo += `</div>`;
    }
    const numFormat = num => `${num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

    const parseNewlines = paragraph => paragraph.replace(/\\n/g, "<br/>")

    return `<noscript>
    <title>${package.title} by ${package.author} - Homebrew App Store (${platform})</title>
    ${getCssEmbed(platform)}
    <div class="nojs-page">
        <div class="colorbar"></div>
        <h3><a href="/${platform}"><img src="/icon.png" alt="App Store Icon"/>Homebrew App Store (${platform})</a></h3>
        <div class="app-info">
        <div class="app-icon">
            <h2>${package.title}<br/><span>by ${package.author}</h2>
            <img src="https://${platform}.cdn.fortheusers.org/packages/${package.name}/icon.png" alt="${package.title} icon">
        </div>
            <ul class="info">
            <table>
                <tr><tr><td>Version</td><td>${package.version}</td></tr>
                <tr><td>Zip size</td><td>${numFormat(package.filesize)} MiB</td></tr>
                <tr><td>License</td><td>${package.license}</td></tr>
                <tr><td>Updated</td><td>${package.updated}</td></tr>
                <tr><td>Downloads</td><td>${numFormat(package.app_dls)}</td></tr>
                <tr><td>MD5</td><td><code>${package.md5}</code></td></tr>
            </table>
            </ul>
        </div>
        <div class="links">
            <a href="https://${platform}.cdn.fortheusers.org/zips/${package.name}.zip" class="btn">Download</a> <a href="${package.url}" class="btn">Source</a></li>
        </div>
        <div class="description">
            <h4>App Details</h4>
            <p>${parseNewlines(package.details)}</p>
            ${screenshotInfo}
            <h4>Changelog</h4>
            <p>${parseNewlines(package.changelog || "n/a")}</p>
        </div>
    </div>
    ${footer}
    </noscript>`;
};

// wrap it all in one async function
(async () => {
    // change into the build directory
    process.chdir(path.resolve(__dirname, './build'));

    // get a copy of the main HTML, which we will copy and replace into each folder
    const mainHTML = fs.readFileSync("index.html", "utf8");

    // read all packages from the switch and wiiu repos
    const platforms = ["switch", "wiiu"];
    const colors = ["#d62131", "#118ab7"];
    for (let idx=0; idx<platforms.length; idx++) {
        const platform = platforms[idx];
        const url = `https://${platform}.cdn.fortheusers.org/repo.json`;
        // fetch the json
        const data = await fetch(url).then((res) => res.json());
        // cd into a folder for this platform
        fs.mkdirSync(platform, { recursive: true });
        process.chdir(platform);
        // create a folder for each package
        const { packages } = data;
        packages.forEach((pkg) => {
            fs.mkdirSync(pkg.name, { recursive: true });
            let curHTML = mainHTML;
            // replace existing ogp properties
            const properties = {
                "og:title": `${pkg.title} by ${pkg.author}`,
                "og:description": `${pkg.description} (${pkg.license})`,
                "og:image": `https://${platform}.cdn.fortheusers.org/packages/${pkg.name}/icon.png`,
                "og:url": `https://hb-app.store/${platform}/${pkg.name}`
            };
            for (const [prop, value] of Object.entries(properties)) {
                curHTML = curHTML.replace(new RegExp(`property="${prop}" content="[^"]*"`, "g"), `property="${prop}" content="${value}"`);
            }
            // also tack on a color for the theme
            curHTML = curHTML.replace("\"theme-color\" content=\"#000000\"", `\"theme-color\" content=\"${colors[idx]}\"`);

            // AND, fill out the <noscript> tags with our no-js template
            curHTML = curHTML.replace(noscriptMarker, buildNoscriptHtml(platform, pkg));

            // write the HTML to the folder
            fs.writeFileSync(`${pkg.name}/index.html`, curHTML);
        });

        // also write a platform specific HTML
        let curHTML = mainHTML.replace("\"theme-color\" content=\"#000000\"", `\"theme-color\" content=\"${colors[idx]}\"`);
        curHTML = curHTML.replace(noscriptMarker, buildNoscriptIndex(platform, packages));
        fs.writeFileSync(`index.html`, curHTML);

        // go up a dir before going back around
        process.chdir("..");
    }

    // and finally, write the home page
    const homeHTML = mainHTML.replace(noscriptMarker, buildNoscriptHome());
    fs.writeFileSync(`index.html`, homeHTML);
})();