//this is ugly but is to trial some stuff is all :s

let repos = [
    "https://www.switchbru.com/appstore/repo.json",
    "https://www.wiiubru.com/appstore/repo.json",
  ];


const LibGet = {
  repos,

  getApps: () => {
    return Promise.all(repos.map(url => fetch(`${url}/repo.json`)));
  }
}

export default LibGet;
