const Router = require("koa-router");
const r = new Router();
const fs = require("fs");
const path = require("path");
const mongodb = require("./lib/mongodb");
const middleware = require("./middleware");
const Hash = require("./lib/hash.js");
const utils = require("./lib/utils.js");

const COLLECTION = "test";
const COLLECTION_PAPERS = "papers";
const COLLECTION_Q = "questions";

r.post("/list", middleware.getSession(), async ( ctx ) => {
  const req = ctx.request.body;
  const query = {
    _id: ctx.state.openid
  };
  
  const hash = Hash(req.item);
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
      let info = (await mongodb.find("user", {_id:k}))[0];
      info && (info = info.userInfo);
      v.player = info;
    }
  }
}

const PAPERS_LENGTH = 5;
r.get("/papers/:lastkey", async ( ctx ) => {
  let _lastkey = +ctx.params.lastkey,
            has_more;
  const query = {
    "data.post.publish_time": {
      $gt: _lastkey
    }
  };
  let list = (await mongodb.find(COLLECTION_PAPERS, query));
  has_more = list.length > PAPERS_LENGTH;
  list = list.slice(0,PAPERS_LENGTH);
  await handlePaperGet(list);
  ctx.body = {
    has_more,
    last_key: _lastkey,
    feeds: list
  };
});

async function handlePaperGet(list) {
  for(let i = list.length-1; i >=0; i--) {
    let item = list[i],
         _ql = item.data.post.questions;
    for(let j = _ql.length-1; j >=0; j--) {
      let _id = _ql[j],
           q = { _id };
      // let res = (await mongodb.find(COLLECTION_Q, q))[0];
      let res = await mongodb.findOne(COLLECTION_Q, q);
      _ql[j] = res;
    }
  };
}


// 从json文件更新题库
const FILE_PATH = path.join(__dirname, "../files/papers.json");
r.post("/papers", async ( ctx ) => {
  const _papers = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
  for(let i = _papers.length-1; i >=0; i--) {
    let item = await handlePaper(_papers[i]),
         q = { _id: item.post._id };
    let res = await mongodb.update(COLLECTION_PAPERS, q, {
      $set: {
        data: item
      }
    });
  };
  ctx.body = {};
});

async function handlePaper(data) {
  let time = new Date().getTime();
  data.post._id = Hash(data.post.title);
  data.post.publish_time = time;
  data.post.questions = await handleQ(data.post.questions);
  return data;
}

async function handleQ(list) {
  const _list = [];
  for(let i = list.length-1; i >=0; i--) {
    let item = list[i],
         _id = Hash(JSON.stringify(item)),
         q = { _id };
    let res = await mongodb.update(COLLECTION_Q, q, {
      $set: {
        data: item
      }
    });
    _list.unshift(_id);
  };
  return _list;
}


module.exports = r;