import React, { Fragment, useEffect, useState } from 'react';
import { FullWidthAd, Spacer, Mobile } from './Utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import JSZip from 'jszip';
import { urlToPromise, saveAs } from './LibGet';
import AppList from './AppList';
import loader from './img/loader.gif';
//import noicon from './img/noicon.png';
import './Quickstore.css';

const plats = {
    "wiiu": "Wii U",
    "switch": "Switch",
};

type Package = {
    name: string,
    title: string,
    description: string,
    url: string,
    platform: string,
    version: string,
    app_dls: number,
    web_dls: number,
    size: string,
    icon: string,
    repo: string,
};

const isGithubUrl = (url: string) => {
    return url.startsWith("https://github.com");
};

const formatGH = (url: string) => {
    const parts = url.replace("https://github.com/", "").split("/");
    return parts[0] + "/" + parts[1];
}

const QuickStore = (props: any) => {

    const [ allApps, setAllApps ] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const allPackages = await AppList.fetchPackages();
            setAllApps(allPackages);
        }
        fetchData();
    }, []);

    const [ selectedPackages, setSelectedPackages ] = useState<string[]>([])
    const [ activePlat, setActivePlat ] = useState<string>("")


    const faPropIcon = faGithub as IconProp;

    const headerInfo = (
        <Fragment>
            <div className="catTitle">
            QuickStore
            </div>
            <p>
                This page allows you to download multiple apps in a single zip file, that can then be extracted directly to the root of the SD card.
            </p>
            <p className="disabled">
                <input type="checkbox" id="experimental" />
                <label htmlFor="experimental">Fetch releases directly from <FontAwesomeIcon icon={faPropIcon} /> Github where possible (Coming Soon)</label>
            </p>
        </Fragment>);

    if (allApps.length === 0) {
        return (<div className="AppList">
        <div className="left">
          <img src={loader} alt="Loading..." style={{width: 270, height: 130}} />
        </div>
      </div>);
    }

    // todo: cross refernce with url platform (should be in props.params)
    const targets = (Object.keys(plats) as Array<keyof typeof plats>).map((plat) => {
        let curApps = allApps.filter((app: Package) => app.platform === plat);
        curApps.sort((a: Package, b: Package) => {
            return (b.app_dls - a.app_dls < 0) ? -1 : 1;
        });
        return (
            <Fragment>
                <h2 onClick={() => {
                    if (selectedPackages.length === 0) {
                        setSelectedPackages(["appstore"])
                    }
                    if (activePlat === plat) {
                        setActivePlat("");
                        setSelectedPackages([])
                        return
                    }
                    setActivePlat(plat);
                }}
                className={activePlat === "" ? "" : "nobg"}>
                    {plats[plat]}
                </h2>
                <div className="clearfix" />
                <div key={plat} className={`catItem${activePlat == plat ? " show" : ""}`}>
                    {curApps.map((app: Package) => {
                        const thisSelected = selectedPackages.find(sp => sp == app.name);
                        return (
                            <div
                                key={app.name}
                                className={`quickItem${thisSelected ? " show" : ""}`}
                                onClick={() => {
                                    if (thisSelected) {
                                        // console.log(selectedPackages)
                                        // console.log(selectedPackages.filter(sp => sp !== app.name))
                                        setSelectedPackages(selectedPackages.filter(sp => sp !== app.name));
                                    } else {
                                        setSelectedPackages([...selectedPackages, app.name]);
                                    }
                                }}
                            >
                                <img src={`${app.repo}/packages/${app.name}/icon.png`} alt={app.title} />
                                <div>
                                    <a
                                        // href={`/${plat}/${app.name}`}
                                    >
                                        {app.title}
                                    </a>
                                    <div className="desc">
                                        &nbsp;{app.description}
                                    </div>
                                    { isGithubUrl(app.url) && (<a
                                        className="url"
                                        // href={app.url}
                                    >
                                        <FontAwesomeIcon icon={faPropIcon} />&nbsp;{formatGH(app.url)}
                                    </a>) }
                                </div>
                            </div>
                        )
                    })}
                </div>
            </Fragment>
        )
    });

    console.log("Thanks")
    console.log(selectedPackages);

    const dlButton = <div>
        <button
            className="dlButton"
            disabled={selectedPackages.length === 0}
            onClick={async () => {
                let allURLs = selectedPackages.map((sp: string) => {
                    const pkg = allApps.find((app: Package) => app.name == sp && app.platform == activePlat);
                    if (pkg === undefined) {
                        return "";
                    }
                    // TODO: fetch github releases if selected
                    return `${pkg['repo']}/zips/${pkg['name']}.zip`;
                });
                const allZips = await Promise.all(allURLs.map(async (url: string, index: number) => {
                    const zip = new JSZip();
                    await zip.loadAsync(await urlToPromise(url), { createFolders: true });
                    return zip;
                }));
                // https://stackoverflow.com/questions/57513029/i-have-to-different-zip-files-created-using-jszip-is-is-possible-to-combile-the
                let mergedZip = new JSZip();
                for (let zipObject of allZips) {
                    console.log("Zipping");
                    mergedZip = await mergedZip.loadAsync(
                        await zipObject.generateAsync({ type: "blob" }),
                        { createFolders: true }
                    );
                    console.log(mergedZip.files);
                }
                console.log(mergedZip.files)
                saveAs(await mergedZip.generateAsync({ type: "blob" }), `quickstore-extracttosd.zip`);
            }}
        >
            <FontAwesomeIcon icon={faDownload} />
            &nbsp;
            Download Selected
        </button>
        &nbsp;
        {selectedPackages.length} Packages Selected
    </div>;

    return (
        <div className="quickstore-container">
          <Mobile />
          { headerInfo }
          { dlButton }
          { targets }
          <FullWidthAd />
          <Spacer />
        </div>
      );
};

export default QuickStore;
