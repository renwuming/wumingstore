const Router = require("koa-router");
const r = new Router();
const mongodb = require("./lib/mongodb");
const middleware = require("./middleware");

const COLLECTION = "user";

r.post("/userinfo", middleware.getSession(), async ( ctx ) => {
  const userInfo = ctx.request.body.userInfo;
  if(typeof userInfo === "string") userInfo = JSON.parse(userInfo);
  let updata = { userInfo };
  res = await mongodb.update(COLLECTION, {
    _id: ctx.state.openid,
  }, {
    $set: updata
  });
  ctx.body = {};
});

r.get("/userinfo", middleware.getSession(), async ( ctx ) => {
  const userInfo = await mongodb.findOne(COLLECTION, {
    _id: ctx.state.openid,
  });
  ctx.body = {
    userInfo
  };
});

module.exports = r;