const Router = require("koa-router");
const r = new Router();
const mongodb = require("./lib/mongodb");
const middleware = require("./middleware");

const COLLECTION = "touch";

const GAMETIMELIST = [1,1,1,1,1,1,1,1,1,1,1];

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
  let name, player_updata = {}, data = (await mongodb.find(COLLECTION, query))[0].gamedata;
  if(count>0) name = "gamedata.op_table."+openid+".up";
  else name = "gamedata.op_table."+openid+".down";
  if(openid != data.boss) player_updata = {["gamedata.player_table."+openid]:1};
  let res = await mongodb.update(COLLECTION, query, {
    $inc: {"gamedata.countdown": count, [name]: 1},
    $set: player_updata
  });
  if(res.errmsg) {
    ctx.body = res;
  } else {
    res = (await mongodb.find(COLLECTION, query))[0];
    let levelup = await checkState(res);
    if(levelup) res = (await mongodb.find(COLLECTION, query))[0];
    ctx.body = await gamedataHandle(res.gamedata, openid);
  }
});

async function checkState(resdata) {
  const _id = resdata._id, data = resdata.gamedata;
  if(data.countdown <= 0) {
    const query = {
      _id
    };
    const newlevel = ++data.level;
    setBossAndPlayer(data); // change Boss & level
    data.countdown = GAMETIMELIST[data.level] || 1; // change countdown time
    let res = await mongodb.update(COLLECTION, query, {
      $set: {gamedata: data}
    });
    return true;
  }
  return false;
}

function setBossAndPlayer(data) {
  let keylist = Reflect.ownKeys(data.player_table), L = keylist.length;
  if(L <= 0) {
    data.player_table = data.boss_table;
    data.boss_table = {};
    setBossAndPlayer(data);
  } else {
    const r = Math.floor(Math.random()*L);
    const k = keylist[r];
    data.boss_table[k] = 1;
    delete data.player_table[k];
    data.boss = k;
  }
}

async function gamedataHandle(data, openid) {
  let res = {
    countdown: data.countdown,
    downSum: 0,
    upSum: 0,
    playerList: [],
    level: data.level,
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
