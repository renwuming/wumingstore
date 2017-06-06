const Router = require("koa-router");
const router = new Router();

const common = require("./common");

const r = function(app) {

  router.use(common.routes(), common.allowedMethods());

  app.use(router.routes()).use(router.allowedMethods());
}

module.exports = r;