const Router = require("koa-router");
const r = new Router();
const mongodb = require("./lib/mongodb");
const middleware = require("./middleware");

const COLLECTION = "touch";

const GAMETIMELIST = [60,100,200,500,1000];
let LOCK = false;

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
        player_table: {},
        score: 0
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
  if(!(data.boss_table[openid]||data.player_table[openid])) player_updata = {["gamedata.player_table."+openid]:1};
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
  if(LOCK) {
    await sleep(500);
    return true;
  } else {
    if(data.countdown <= 0) {
      LOCK = true;
      const query = {
        _id
      };
      data.score += GAMETIMELIST[data.level] || 1000;
      const newlevel = ++data.level;
      setBossAndPlayer(data); // change Boss & level
      data.countdown = GAMETIMELIST[data.level] || 1000; // change countdown time
      let res = await mongodb.update(COLLECTION, query, {
        $set: {gamedata: data}
      });
      LOCK = false;
      return true;
    }
    return false;
  }
}

let sleep = function(delay) {
  return new Promise(function(resolve, reject) {
    setTimeout(() => {
      resolve();
    }, delay);
  });
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
    bossInfo: (await mongodb.find("user", {_id: data.boss}))[0].userInfo,
    score: data.score
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
