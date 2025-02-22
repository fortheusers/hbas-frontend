// This script builds the OGP (Open Graph Protocol) folders for the frontend
// It does this by pulling the current state of the repos from the API, and copying
// the main HTML page into each of the nested folders.
// This means that if the repos update, the site will need to be rebuilt for newly
// added apps to have their OGP folders created.

const fs = require('fs');
const path = require('path');
const process = require('process');

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

            // write the HTML to the folder
            fs.writeFileSync(`${pkg.name}/index.html`, curHTML);
        });

        // also write a platform specific HTML
        const curHTML = mainHTML.replace("\"theme-color\" content=\"#000000\"", `\"theme-color\" content=\"${colors[idx]}\"`);
        fs.writeFileSync(`index.html`, curHTML);

        // go up a dir before going back around
        process.chdir("..");
    }
})();