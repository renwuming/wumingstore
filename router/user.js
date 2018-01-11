const Router = require("koa-router");
const r = new Router();
const mongodb = require("./lib/mongodb");
const middleware = require("./middleware");

const COLLECTION = "user";
const DEFAULT_INFO = {
  nickName: "神秘人",
  gender: 2,
  language: "isDefault",
  city: "",
  province: "",
  country: "",
  avatarUrl: "https://www.renwuming.xyz/wumingstore/img/portrait.jpg",
};

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
  let userInfo = await mongodb.findOne(COLLECTION, {
    _id: ctx.state.openid,
  });
  if(!userInfo) {
    userInfo = DEFAULT_INFO;
    mongodb.update(COLLECTION, {
      _id: ctx.state.openid,
    }, {
      $set: { userInfo }
    });
  } else userInfo = userInfo.userInfo;
  ctx.body = {
    userInfo
  };
});

module.exports = r;