const Router = require("koa-router");
const router = new Router();

const common = require("./common");
const poker = require("./poker");

const r = function(app) {

  router.use(common.routes(), common.allowedMethods());
  router.use("/poker", poker.routes(), poker.allowedMethods());

  app.use(router.routes()).use(router.allowedMethods());
}

module.exports = r;