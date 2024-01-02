import JSZipUtils from 'jszip-utils';
import { saveAs } from 'filesaver.js';

const repos = [
    {
      url: "https://switch.cdn.fortheusers.org",
      platform: "switch"
    },
    {
      url: "https://wiiu.cdn.fortheusers.org",
      platform: "wiiu"
    }
  ];


const LibGet = {
  repos,

  getRepos: (platform = "all") => {
    if (platform === "3ds") {
      return [{
        url: "https://3ds.apps.fortheusers.org",
        platform : "3ds"
      }];
    }
    return repos.filter(repo => platform === "all" || repo.platform === platform);
  },

  getStats: () => {
    return fetch("https://wiiubru.com/history/output.json");
  },

  getApps: (myRepos = repos) => {
    return Promise.all(myRepos.map(repo => fetch(`${repo.url}/repo.json`)));
  }
}

function urlToPromise(url) {
    return new Promise(function(resolve, reject) {
        JSZipUtils.getBinaryContent(url, function (err, data) {
            if(err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}    

export default LibGet;
export { urlToPromise, saveAs };
