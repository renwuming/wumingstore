const Router = require("koa-router");
const r = new Router();
const http = require("./lib/http");
const WXBizDataCrypt = require("./lib/WXBizDataCrypt");
const redis = require("./lib/redis");

const AppID = "wx78bc21b55d1cc0c5";
const AppSecret = "e84cd2c585853ddbb0cb59f784f9895c";
const EXPIRE_TIME = 3600*24*7;

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
    redis.set(sessionid, JSON.stringify(res), redis.print);
    redis.expire(sessionid, EXPIRE_TIME); // 有效期一星期
    ctx.body = sessionid;
  }

});

r.post("/decryptedData", async ( ctx ) => {
  const req = ctx.request.body;
  const sk = await redis.getSync(req.sessionid);
  const pc = new WXBizDataCrypt(AppID, sk);
  let data;
  try {
    data = pc.decryptData(req.encryptedData, req.iv);
  } catch(e) {
    data = e;
  }

console.log('解密后 data: ', data)

  ctx.body = data;
});

module.exports = r;