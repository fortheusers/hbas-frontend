const repos = [
    "https://www.switchbru.com/appstore",
    "https://www.wiiubru.com/appstore",
    //"https://4tu.gitlab.io/dragonite-test-repo",
  ];


const LibGet = {
  repos,

  getApps: () => {
    return Promise.all(repos.map(url => fetch(`${url}/repo.json`)));
  }
}

export default LibGet;
