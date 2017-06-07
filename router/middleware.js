const redis = require("./lib/redis");
const mid = {};

mid.getSessionkey = function() {
  return async function(ctx, next) {
    const req = ctx.request.body;
    let sk = await redis.getSync(req.sessionid);
    sk && (sk = JSON.parse(sk).session_key);
    if(sk) {
      ctx.state.sessionkey = sk;
      next();
    } else {
      ctx.body = {errcode: 1001};
    }
  }
}

module.exports = mid;