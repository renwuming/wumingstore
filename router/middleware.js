const redis = require("./lib/redis");
const mid = {};

mid.getSessionkey = function() {
  return async function(ctx, next) {
    const req = ctx.request.body;
    const sk = await redis.getSync(req.sessionid);
    ctx.state.sessionkey = JSON.parse(sk).session_key;
    next();
  }
}

module.exports = mid;