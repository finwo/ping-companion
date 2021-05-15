const fs   = require('fs/promises');
const http = require('http');
const url  = require('url');
const qs   = require('qs');
const morgan = require('morgan');
const noop = ()=>{};

const port   = parseInt(process.env.PORT ?? 5000)

// Basic router
const router = {
  _:[],
  use(handler) {
    router._.push({handler});
  },
  get(path,handler) {
    router._.push({method:'GET',pathname:path,handler});
  },
  run(req, res, nxt) {
    const routes = router._.slice();
    (function next() {
      if (res.finished) return;
      if (!routes.length) return nxt();
      const route = routes.shift();
      for(const key of Object.keys(route)) {
        if (~['handler'].indexOf(key)) continue;
        if (req[key] != route[key]) return next();
      }
      route.handler(req, res, next);
    })();
  },
};

// Http entrypoint
const server = http.createServer((req, res) => {
  Object.assign(req, url.parse(req.url));
  req.query = qs.parse(req.query);
  router.run(req, res, () => {
    res.writeHead(404,{'content-type':'text/plain'});
    res.end('Not found');
  });
});
server.listen(port, err => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Now listening on :${port}`);
});

router.use(morgan('tiny'));

// Add home route
router.get('/', async (req, res) => {
  const content = await fs.readFile(`${__dirname}/public/index.html`);
  res.writeHead(200,{'content-type':'text/html'});
  res.end(content);
});

// Add js route
router.get('/main.js', async (req, res) => {
  const content = await fs.readFile(`${__dirname}/public/main.js`);
  res.writeHead(200,{'content-type':'application/javascript'});
  res.end(content);
});

// Add the ping route
router.get('/ping', (req, res) => {
  res.writeHead(200,{'content-type':'application/json'});
  res.end(JSON.stringify({
    time: Date.now(),
  }));
});
