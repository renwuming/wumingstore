const koa = require("koa");
const router = require("./router");
const bodyParser = require('koa-bodyparser');
const _static = require('koa-static');
const path = require("path");
const logger = require("./router/lib/logger");
const port = process.env.PORT || 9000;

const app = new koa();

app.use(bodyParser());

const staticPath = './static';
app.use(_static(
  path.join( __dirname, staticPath)
));

app.use(logger); // logger中间件，在router之前调用
router(app);

app.listen(port);
console.info(`\n\r${new Date()}\n\r`);
console.info('app start on port ', port);
