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
  let res = (await mongodb.find(COLLECTION, query))[0];
  if(res) {
    ctx.body = res.gamedata;
  } else {
    const updata = {
      openidlist: [ctx.state.openid],
      gamedata: INIT_GAME_DATA
    };
    res = await mongodb.update(COLLECTION, query, {
      $set: updata
    });
    ctx.body = { INIT_GAME_DATA };
  }
});

r.post("/countdown", middleware.getSession(), middleware.decryptedData(), async ( ctx ) => {
  const req = ctx.request.body;
  const count = req.count;
  const openGId = ctx.state.decryptedData.openGId;
  const openid = ctx.state.openid;
  const query = {
    _id: openGId
  };
  let name;
  if(count<0) name = "gamedata.downtable."+openid;
  else name = "gamedata.uptable."+openid;
  let res = await mongodb.update(COLLECTION, query, {
    $inc: {"gamedata.countdown": count, [name]: 1}
  });
  if(res.errmsg) {
    ctx.body = res;
  } else {
    res = (await mongodb.find(COLLECTION, query))[0];
    ctx.body = gamedataHandle(res.gamedata, openid);
  }
});

function gamedataHandle(data, openid) {
  let res = {};
  res.countdown = data.countdown;
  res.downSum = data.downtable ? data.downtable[openid] : 0;
  res.upSum = data.uptable ? data.uptable[openid] : 0;
  return res;
}

module.exports = r;
