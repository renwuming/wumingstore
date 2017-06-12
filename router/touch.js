const Router = require("koa-router");
const r = new Router();
const mongodb = require("./lib/mongodb");
const middleware = require("./middleware");

const COLLECTION = "touch";

const INIT_GAME_DATA = {
  countdown: 60
};

r.post("/start", middleware.getSession(), middleware.decryptedData(), async ( ctx ) => {
  const openGId = ctx.state.decryptedData.openGId;
  const query = {
    _id: openGId
  };
  let res = await mongodb.find(COLLECTION, query);
  res = res[0];
  if(res) {
    ctx.body = res.gamedata;
  } else {
    const updata = {
      openidlist: [ctx.state.openid],
      gamedata: INIT_GAME_DATA
    };
    res = await mongodb.update(COLLECTION, {
      _id: openGId,
    }, {
      $set: updata
    });
    ctx.body = {};
  }
});

module.exports = r;
