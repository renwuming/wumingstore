const cache = require("./lib/cache")()
const WXBizDataCrypt = require("./lib/WXBizDataCrypt");
const config = require("./lib/config");
const mid = {};

mid.getSession = function() {
  return async function(ctx, next) {
    const req = ctx.request.body,
              req2 = ctx.query,
              sessionid = req.sessionid || req2.sessionid;

    let sk = cache.get(sessionid);
    if(sk) {
      ctx.state.sessionkey = sk.session_key;
      ctx.state.openid = sk.openid;
      await next();
    } else {
      ctx.body = {errMsg: "sessionkey not found"};
    }
  }
}

mid.getSessionBy = async function(sessionid) {
    let sk = cache.get(sessionid);
    sk = sk || {};
    return sk.openid;
}

mid.decryptedData = function() {
  return async function(ctx, next) {
    const req = ctx.request.body;
    if(req.encryptedData && req.iv) {
      const pc = new WXBizDataCrypt(config.AppID, ctx.state.sessionkey);
      try {
        ctx.state.decryptedData = pc.decryptData(req.encryptedData, req.iv);
      } catch(e) {
        ctx.body = {errMsg: e.toString()};
        return;
      }
      await next();
    } else {
      ctx.body = {errMsg: "encryptedData not found"};
    }
  }
}

module.exports = mid;