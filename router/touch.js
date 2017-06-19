const Router = require("koa-router");
const r = new Router();
const mongodb = require("./lib/mongodb");
const middleware = require("./middleware");

const COLLECTION = "touch";

const GAMETIMELIST = [300];

r.post("/start", middleware.getSession(), middleware.decryptedData(), async ( ctx ) => {
  const openGId = ctx.state.decryptedData.openGId;
  const openid = ctx.state.openid;
  const query = {
    _id: openGId
  };
  let res = (await mongodb.find(COLLECTION, query))[0];
  if(res) {
    ctx.body = await gamedataHandle(res.gamedata, openid);
  } else {
    const updata = {
      gamedata: {
        countdown: GAMETIMELIST[0],
        level: 0,
        boss: openid,
        boss_table: {[openid]: 1},
        player_table: {}
      }
    };
    res = await mongodb.update(COLLECTION, query, {
      $set: updata
    });
    ctx.body = await gamedataHandle(updata.gamedata, openid);
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
  if(count>0) name = "gamedata.op_table."+openid+".up";
  else name = "gamedata.op_table."+openid+".down";
  let res = await mongodb.update(COLLECTION, query, {
    $inc: {"gamedata.countdown": count, [name]: 1}
  });
  if(res.errmsg) {
    ctx.body = res;
  } else {
    res = (await mongodb.find(COLLECTION, query))[0];
    ctx.body = await gamedataHandle(res.gamedata, openid);
  }
});

async function gamedataHandle(data, openid) {
  let res = {
    countdown: data.countdown,
    downSum: 0,
    upSum: 0,
    playerList: [],
    bossInfo: (await mongodb.find("user", {_id: data.boss}))[0].userInfo
  };
  if(data.op_table) {
    let dt = data.op_table;
    res.downSum = dt[openid]&&dt[openid].down ? dt[openid].down : 0;
    res.upSum = dt[openid]&&dt[openid].up ? dt[openid].up : 0;
    for(key in dt) {
      let info = (await mongodb.find("user", {_id:key}))[0].userInfo;
      res.playerList.push({
        info: info,
        downSum: dt[key].down,
        upSum: dt[key].up
      });
    }
  }

  return res;
}

module.exports = r;
