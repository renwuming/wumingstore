const Router = require("koa-router");
const r = new Router();
const http = require("./lib/http");
const WXBizDataCrypt = require("./lib/WXBizDataCrypt");
const redis = require("./lib/redis");
const mongodb = require("./lib/mongodb");
const middleware = require("./middleware");


const AppID = "wx78bc21b55d1cc0c5";
const AppSecret = "e84cd2c585853ddbb0cb59f784f9895c";

r.post("/sessionkey", async ( ctx ) => {
  const req = ctx.request.body;
  const data = {
    appid: AppID,
    secret: AppSecret,
    js_code: req.js_code,
    grant_type: "authorization_code"
  }
  const res = await http.get("https://api.weixin.qq.com/sns/jscode2session", data);
  if(res.errcode) {
    ctx.body = res;
  } else {
    const sessionid = WXBizDataCrypt.randomKey();
    redis.setSync(sessionid, req);
    ctx.body = sessionid;
  }
});

r.post("/decryptedData", middleware.getSession(), async ( ctx ) => {
  const req = ctx.request.body;
  const pc = new WXBizDataCrypt(AppID, ctx.state.sessionkey);
  let data;
  try {
    data = pc.decryptData(req.encryptedData, req.iv);
  } catch(e) {
console.log(e);
    data = e;
  }
  ctx.body = data;
});

module.exports = r;