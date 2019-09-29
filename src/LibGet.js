
const repos = [
    "https://www.switchbru.com/appstore/repo.json",
    "https://www.wiiubru.com/appstore/repo.json",
    //"https://4tu.gitlab.io/dragonite-test-repo",
  ];


const LibGet = {
  repos,

  getApps: () => {
    return Promise.all(repos.map(url => fetch(`${url}/repo.json`)));
  }
}

export default LibGet;
