const redis = require("./lib/redis");
const WXBizDataCrypt = require("./lib/WXBizDataCrypt");
const config = require("./lib/config");
const mid = {};

mid.getSession = function() {
  return async function(ctx, next) {
    const req = ctx.request.body;
    let sk = await redis.getSync(req.sessionid);
    if(sk) {
      sk = JSON.parse(sk);
      ctx.state.sessionkey = sk.session_key;
      ctx.state.openid = sk.openid;
      await next();
    } else {
      ctx.body = {errcode: 6666};
    }
  }
}

mid.decryptedData = function() {
  return async function(ctx, next) {
    const req = ctx.request.body;
    if(req.encryptedData && req.iv) {
      const pc = new WXBizDataCrypt(config.AppID, ctx.state.sessionkey);
      try {
        ctx.state.decryptedData = pc.decryptData(req.encryptedData, req.iv);
      } catch(e) {
        ctx.body = e;
        return;
      }
    }
    await next();
  }
}

module.exports = mid;