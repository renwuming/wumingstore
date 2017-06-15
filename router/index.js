const Router = require("koa-router");
const router = new Router();

const common = require("./common");
const user = require("./user");
const poker = require("./poker");
const touch = require("./touch");

const r = function(app) {

  router.use(common.routes(), common.allowedMethods());
  router.use("/user", user.routes(), user.allowedMethods());
  router.use("/poker", poker.routes(), poker.allowedMethods());
  router.use("/touch", touch.routes(), touch.allowedMethods());

  app.use(router.routes()).use(router.allowedMethods());
}

module.exports = r;