//this is ugly but is to trial some stuff is all :s

let repos = [];

if (window.location.href == 'http://localhost:3000/') {
 repos = [
  "https://4tu.gitlab.io/dragonite-test-repo",
];
}
else if (window.location.href == 'https://apps.fortheusers.org/switch')
{
  repos = [
    "https://www.switchbru.com/appstore/repo.json",
  ];
}
else if (window.location.href == 'https://apps.fortheusers.org/wiiu')
{
  repos = [
    "https://www.wiiubru.com/appstore/repo.json",
  ];
}
else if (window.location.href == 'https://apps.fortheusers.org/all')
{
  repos = [
    "https://www.switchbru.com/appstore/repo.json",
    "https://www.wiiubru.com/appstore/repo.json",
  ];
}

const LibGet = {
  repos,

  getApps: () => {
    return Promise.all(repos.map(url => fetch(`${url}/repo.json`)));
  }
}

export default LibGet;
