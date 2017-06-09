const redis = require("./lib/redis");
const mid = {};

mid.getSession = function() {
  return async function(ctx, next) {
    const req = ctx.request.body;
    let sk = await redis.getSync(req.sessionid);
    if(sk) {
      sk = JSON.parse(sk);
      ctx.state.sessionkey = sk.sessionkey;
      ctx.state.openid = sk.openid;
      await next();
    } else {
      ctx.body = {errcode: 6666};
    }
  }
}

module.exports = mid;