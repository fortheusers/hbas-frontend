const repos = [
    {
      url: "https://www.switchbru.com/appstore",
      platform: "switch"
    },
    {
      url: "https://www.wiiubru.com/appstore",
      platform: "wiiu"
    },
    // {
    //   url: "https://4tu.gitlab.io/dragonite-test-repo",
    //   platform: "switch"
    // }
  ];


const LibGet = {
  repos,

  getRepos: (platform = "both") => {
    return repos.filter(repo => platform === "both" || repo.platform === platform);
  },

  getApps: (myRepos = repos) => {
    return Promise.all(myRepos.map(repo => fetch(`${repo.url}/repo.json`)));
  }
}

export default LibGet;
