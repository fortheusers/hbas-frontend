const repos = [
  "https://switchbru.com/appstore",
  "https://wiiubru.com/appstore",
  //"https://4tu.gitlab.io/dragonite-test-repo",
];

const LibGet = {
  repos,

  getApps: () => {
    return Promise.all(repos.map(url => fetch(`${url}/repo.json`)));
  }
}

export default LibGet;
