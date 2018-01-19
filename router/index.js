const Router = require("koa-router");
const router = new Router();

const common = require("./common");
const user = require("./user");
const poker = require("./poker");
const touch = require("./touch");
const test = require("./test");
const test_bk = require("./test_bk");

const r = function(app) {

  router.use(common.routes(), common.allowedMethods());
  router.use("/user", user.routes(), user.allowedMethods());
  router.use("/poker", poker.routes(), poker.allowedMethods());
  router.use("/touch", touch.routes(), touch.allowedMethods());
  router.use("/test", test.routes(), test.allowedMethods());
  router.use("/test", test_bk.routes(), test_bk.allowedMethods());

  app.use(router.routes()).use(router.allowedMethods());
}

module.exports = r;