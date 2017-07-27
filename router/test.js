const Router = require("koa-router");
const r = new Router();
const mongodb = require("./lib/mongodb");
const middleware = require("./middleware");
const jsSHA = require("jssha");

const COLLECTION = "test";

r.post("/list", middleware.getSession(), async ( ctx ) => {
  const req = ctx.request.body;
  const query = {
    _id: ctx.state.openid
  };
  let shaObj = new jsSHA("SHA-512", "TEXT");
  shaObj.update(req.item);
  const hash = shaObj.getHash("HEX").substr(0,16);

  let list = (await mongodb.find(COLLECTION, query))[0];
  list = list ? list.testlist : {};
  list[hash] = req.item;

  let res = await mongodb.update(COLLECTION, query, {
    $set: {
      testlist: list
    }
  });
  ctx.body = {};
});

r.post("/getlist", middleware.getSession(), async ( ctx ) => {
  const query = {
    _id: ctx.state.openid
  };
  let list = (await mongodb.find(COLLECTION, query))[0];
  list = list ? list.testlist : {};

  ctx.body = list;
});

r.post("/getitem", middleware.getSession(), async ( ctx ) => {
  const key = ctx.request.body.key;
  const query = {
    _id: ctx.state.openid
  };
  let list = (await mongodb.find(COLLECTION, query))[0];
  list = list ? list.testlist : {};

  ctx.body = list[key];
});

r.post("/commit", middleware.getSession(), async ( ctx ) => {
  const req = ctx.request.body;
  const data = {
    player: await middleware.getSessionBy(req.player),
    data: req.data
  };
  const query = {
    _id: ctx.state.openid
  };
  let list = (await mongodb.find(COLLECTION, query))[0];
  if(list && list.answerlist) {
    list = list.answerlist;
  } else {
    list = {};
  }
  if(list[req.key]) {
    list[req.key].push(data);
  } else {
    list[req.key] = [data];
  }
  let res = await mongodb.update(COLLECTION, query, {
    $set: {
      answerlist: list
    }
  });

  ctx.body = {};
});

r.post("/getreslist", middleware.getSession(), async ( ctx ) => {
  const req = ctx.request.body;
  const query = {
    _id: ctx.state.openid
  };
  let list = (await mongodb.find(COLLECTION, query))[0];
  if(list && list.answerlist) {
    list = list.answerlist;
    await handleData(list);
  } else {
    list = {};
  }
  
  ctx.body = list;
});

async function handleData(data) {
  for(let key in data) {
    for(let v of data[key]) {
      let k = v.player;
      let info = (await mongodb.find("user", {_id:k}))[0].userInfo;
      e.player = info;
    }
  }
}

module.exports = r;