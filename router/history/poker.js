const Router = require("koa-router");
const r = new Router();
const mongodb = require("./lib/mongodb");
const middleware = require("./middleware");

const COLLECTION = "poker";

r.post("/update", middleware.getSession(), async ( ctx ) => {
  const req = ctx.request.body;
  let updata = { time: +new Date() };
  for(key in req) {
    if(key === "sessionid") continue;
    updata[key] = req[key];
  }
  let res = await mongodb.update(COLLECTION, {
    _id: ctx.state.openid,
  }, {
    $set: updata
  });
  ctx.body = {};
});

r.post("/data", middleware.getSession(), async ( ctx ) => {
  const req = ctx.request.body;
  const query = {
    _id: ctx.state.openid
  };
  let res = await mongodb.find(COLLECTION, query);
  res = res[0];
  // 只能获取一天内的数据
  if(res && sameDay(new Date(res.time))) {
    delete res._id;
    ctx.body = res;
  } else {
    ctx.body = { count:-1 };
  }
});

function sameDay(date) {
  let today = new Date();
  let y1 = date.getYear();
  let y2 = today.getYear();
  let m1 = date.getMonth();
  let m2 = today.getMonth();
  let d1 = date.getDate();
  let d2 = today.getDate();
  return y1 === y2 && m1 === m2 && d1 === d2;
}

module.exports = r;
