const Router = require("koa-router");
const r = new Router();
const http = require("./lib/http");

const config = require("./lib/config");
const WXBizDataCrypt = require("./lib/WXBizDataCrypt");
const redis = require("./lib/redis");
const mongodb = require("./lib/mongodb");
const middleware = require("./middleware");


r.post("/sessionkey", async ( ctx ) => {
  const req = ctx.request.body;
  const data = {
    appid: config.AppID,
    secret: config.AppSecret,
    js_code: req.js_code,
    grant_type: "authorization_code"
  }
  const res = await http.get("https://api.weixin.qq.com/sns/jscode2session", data);
  if(res.errcode) {
    ctx.body = res;
  } else {
    const sessionid = WXBizDataCrypt.randomKey();
    redis.setSync(sessionid, res);
    ctx.body = sessionid;
  }
});

module.exports = r;