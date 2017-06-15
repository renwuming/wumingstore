const Router = require("koa-router");
const r = new Router();
const mongodb = require("./lib/mongodb");
const middleware = require("./middleware");

const COLLECTION = "user";

r.post("/userinfo", middleware.getSession(), async ( ctx ) => {
  const req = ctx.request.body;
  const updata = {
    userInfo: req.userInfo
  };
  res = await mongodb.update(COLLECTION, {
    _id: ctx.state.openid,
  }, {
    $set: updata
  });
  ctx.body = {};
});

module.exports = r;