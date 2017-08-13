const koa = require("koa");
const router = require("./router");
const bodyParser = require('koa-bodyparser');
const static = require('koa-static');
const path = require("path");
const port = process.env.PORT || 9000;

const app = new koa();

app.use(bodyParser());

const staticPath = './static';
app.use(static(
  path.join( __dirname, staticPath)
));

router(app);

app.listen(port);
console.info(`\n\r${new Date()}\n\r`);
console.info('app start on port ', port);
