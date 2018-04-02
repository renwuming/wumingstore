const Router = require("koa-router");
const router = new Router();

const common = require("./common");
const user = require("./user");
const test = require("./test");
const test_friend = require("./test_friend");
const test_bk = require("./test_bk");

const r = function(app) {

  router.use(common.routes(), common.allowedMethods());
  router.use("/user", user.routes(), user.allowedMethods());
  router.use("/test", test.routes(), test.allowedMethods());
  router.use("/test", test_friend.routes(), test_friend.allowedMethods());
  router.use("/test/bk", test_bk.routes(), test_bk.allowedMethods());

  app.use(router.routes()).use(router.allowedMethods());
}

module.exports = r;