import React, { Fragment, useEffect, useState } from 'react';
import { Spacer, Mobile, getParams } from './Utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { faCircleNotch, faDownload } from '@fortawesome/free-solid-svg-icons';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import JSZip from 'jszip';
import { urlToPromise, saveAs } from './LibGet';
import PlatformPicker from './PlatformPicker';
import {fetchPackages} from './AppList';
import loader from './img/loader.gif';
import noicon from './img/noicon.png';
import './Quickstore.css';

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

type Platform = "wiiu" | "switch" | "3ds";

const QuickStore = (props: { platform: Platform }) => {

    const [ allApps, setAllApps ] = useState([]);
    const { platform: plat } = getParams(props) as {platform?: Platform};

    useEffect(() => {
        const fetchData = async () => {
            const allPackages = await fetchPackages();
            setAllApps(allPackages);
        }
        fetchData();
    }, []);

    // no appstore for 3ds
    const initialPkgs = plat === "3ds" ? [] : ["appstore"];

    const [ isDownloading, setIsDownloading ] = useState(false);
    const [ selectedPackages, setSelectedPackages ] = useState<string[]>(initialPkgs)

    const faPropIcon = faGithub as IconProp;
    const faDLPropIcon = faDownload as IconProp;
    const faCirclePropIcon = faCircleNotch as IconProp;

    const headerInfo = (
        <Fragment>
            <div className="catTitle">
            QuickStore
            </div>
            <p>
                This page allows you to download multiple apps in a single zip file, that can then be extracted directly to the root of the SD card.
            </p>
            <p className="disabled">
                <input type="checkbox" id="experimental" disabled/>
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

    if (plat === undefined) {
        return (<div className="quickstore-container">
            <Mobile />
            { headerInfo }
            <PlatformPicker path="/quickstore" isQuickStore />
            <Spacer />
        </div>);
    }

    // todo: cross reference with url platform (should be in props.params)
    let curApps = allApps.filter((app: Package) => app.platform === plat);
    curApps.sort((a: Package, b: Package) => {
        return (b.app_dls - a.app_dls < 0) ? -1 : 1;
    });
    const appList = (
        <Fragment>
            <div key={plat} className={`catItem show`}>
                {curApps.map((app: Package) => {
                    const thisSelected = selectedPackages.find(sp => sp === app.name);
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
                            <img 
                                src={`${app.repo}/packages/${app.name}/icon.png`}
                                onError={(e: any) => { e.target.onerror = null; e.target.src = noicon }}
                                alt={app.title}
                            />
                            <div>
                                <a
                                    href={`/${plat}/${app.name}`}
                                >
                                    {app.title}
                                </a>
                                <div className="desc">
                                    &nbsp;{app.description}
                                </div>
                                { isGithubUrl(app.url) && (<a
                                    className="url"
                                    href={app.url}
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

    const progress = (<div className='progress'><button className="progressBar"> 
            <FontAwesomeIcon icon={faCirclePropIcon} className={"fa-spin"} /> 
            &nbsp;  
            Downloading {selectedPackages.length} packages...
    </button></div>);

    const dlButton = <div>
        <button
            className="dlButton"
            disabled={selectedPackages.length === 0}
            onClick={async () => {
                setIsDownloading(true);
                let allURLs = selectedPackages.map((sp: string) => {
                    const pkg = allApps.find((app: Package) => app.name === sp && app.platform === plat);
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
                    mergedZip = await mergedZip.loadAsync(
                        await zipObject.generateAsync({ type: "blob" }),
                        { createFolders: true }
                    );
                    // console.log(mergedZip.files);
                }
                const screenNames = Array.from(new Array(9), (x, i) => `screen${i+1}.png`);
                const removeUs = [ "manifest.install", "info.json", "icon.png", "pkgbuild.json" ].concat(screenNames);
                removeUs.forEach(file => mergedZip.remove(file));
                saveAs(await mergedZip.generateAsync({ type: "blob" }), `quickstore-extracttosd.zip`);
                setIsDownloading(false);
            }}
        >
            <FontAwesomeIcon icon={faDLPropIcon} />
            &nbsp;
            Download&nbsp;{selectedPackages.length}&nbsp;Selected
        </button>
    </div>;

    return (
        <div className="quickstore-container">
          <Mobile />
          { headerInfo }
          { isDownloading ? progress : dlButton }
          { appList }
          {/* <FullWidthAd /> */}
          <Spacer />
        </div>
      );
};

export default QuickStore;
