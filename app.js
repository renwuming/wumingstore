const koa = require("koa");
const router = require("./router");
const bodyParser = require('koa-bodyparser');
const port = process.env.PORT || 9000;

const app = new koa();

app.use(bodyParser());

router(app);

app.listen(port);
console.info('app start on port ', port);
