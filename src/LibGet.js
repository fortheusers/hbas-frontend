const repos = [
    //{
    //  url: "https://www.switchbru.com/appstore",
    //  platform: "switch"
    //},
    {
      url: "https://wiiubru.com/appstore",
      platform: "wiiu"
    }//,
    //{
    //  url: "https://3ds.apps.fortheusers.org",
    //  platform : "3ds"
    //}
    // {
    //   url: "https://4tu.gitlab.io/dragonite-test-repo",
    //   platform: "switch"
    // }
  ];


const LibGet = {
  repos,

  getRepos: (platform = "all") => {
    return repos.filter(repo => platform === "all" || repo.platform === platform);
  },

  getStats: () => {
    return fetch("https://wiiubru.com/history/output.json");
  },

  getApps: (myRepos = repos) => {
    return Promise.all(myRepos.map(repo => fetch(`${repo.url}/repo.json`)));
  }
}

export default LibGet;
