const Router = require("koa-router");
const r = new Router();
const fs = require("fs");
const path = require("path");
const mongodb = require("./lib/mongodb");
const middleware = require("./middleware");
const Hash = require("./lib/hash.js");
const utils = require("./lib/utils.js");
const config = require("./lib/config.js");

const COLLECTION = "test";
const COLLECTION_USER = "user";
const COLLECTION_PAPERS = "papers";
const COLLECTION_Q = "questions";
const COLLECTION_ANSWERS = "answers";

const DATA_LENGTH = 5;

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

// 根据id获取测试题
r.get("/paper/:id", async ( ctx ) => {
  let _id = ctx.params.id;
  const query = { _id };
  let list = [await mongodb.findOne(COLLECTION_PAPERS, query)];
  if(list.length) {
    await handlePaperGet(list);
  }
  ctx.body = {
    feeds: list
  };
});

// 根据时间戳获取测试题列表
r.get("/papers/:lastkey", async ( ctx ) => {
  let _lastkey = +ctx.params.lastkey,
       has_more,
       query;
  if(_lastkey !== 0) {
    query = {
      "data.publish_time": {
        $lt: _lastkey
      }
    };
  }

  let list = await mongodb.sort(COLLECTION_PAPERS, query, {"data.publish_time": -1});

  has_more = list.length > DATA_LENGTH;
  if(list.length) {
    list = list.slice(0, DATA_LENGTH);
    _lastkey = list[list.length-1].data.publish_time;
    await handlePaperGet(list);
  }
  ctx.body = {
    has_more,
    last_key: _lastkey,
    feeds: list
  };
});

async function handlePaperGet(list) {
  for(let i = list.length-1; i >=0; i--) {
    try {
      let item = list[i],
           _ql = item.data.questions;
      for(let j = _ql.length-1; j >=0; j--) {
        let _id = _ql[j],
             q = { _id };
        let res = await mongodb.findOne(COLLECTION_Q, q);
        _ql[j] = res.data;
        _ql[j].id = _id;
      }
      list[i] = item.data;
      list[i].id = item._id;
    } catch(e) {
      console.error(e);
      continue;
    }
  };
}


// 从json文件更新测试题库
const FILE_PATH = path.join(__dirname, "../files/papers.json");
r.post("/papers", async ( ctx ) => {
  const _papers = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
  for(let i = _papers.length-1; i >=0; i--) {
    let item = await handlePaper(_papers[i]),
         q = { _id: item._id };
    delete item._id;
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
  data._id = Hash(data.title);
  data.publish_time = time;
  data.questions = await handleQ(data.questions);
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

// 提交测试结果
r.post("/result", middleware.getSession(), async ( ctx ) => {
  let req = ctx.request.body,
            { id, questions } = req;
  let answers = questions.map(e=> ({
    id: e.id,
    selected: e.selected
  }));

  const data = {
    from: await middleware.getSessionBy(req.from),
    player: ctx.state.openid,
    id,
    answers,
    publish_time: +new Date()
  };
  let res = await mongodb.insert(COLLECTION_ANSWERS, data);

  ctx.body = {};
});



// 根据时间戳获取测试结果列表
r.get("/results/:lastkey", middleware.getSession(), async ( ctx ) => {
  let _lastkey = +ctx.params.lastkey,
       has_more,
       query = {
         from: ctx.state.openid
       },
       list, papers = [];
  // MASTER_USER获取所有测试结果
  if(config.MASTER_USER === from) delete query.from;
  list = await mongodb.find(COLLECTION_ANSWERS, query);
  list = await handleAnswersGet(list);
  if(_lastkey !== 0) {
    list = list.filter(e => e.publish_time < _lastkey);
  }
  has_more = list.length > DATA_LENGTH;
  if(list.length) {
    list = list.slice(0, DATA_LENGTH);
    _lastkey = list[list.length-1].publish_time;
  }
  // papers数据
  for(let i = list.length-1; i >=0; i--) {
    papers.push(await getPaper(list[i].id));
  }
  ctx.body = {
    has_more,
    last_key: _lastkey,
    feeds: {
      results: list,
      papers
    }
  };
});

async function handleAnswersGet(list) {
  let hash = {},
       results = [];
  for(let i = list.length-1; i >=0; i--) {
    let e = list[i],
         id = e.id;
    e = await handleAnswerGet(e);
    if(hash[id]) {
      hash[id].list.push(e);
      // 最新的publish_time
      if(e.publish_time > hash[id].publish_time) hash[id].publish_time = e.publish_time;
    } else {
      hash[id] = {
        id,
        list: [e],
        publish_time: e.publish_time
      };
    }
  };
  for(let key in hash) {
    results.push(hash[key]);
  }
  return results.sort((a,b) => b.publish_time - a.publish_time);
}

async function handleAnswerGet(item) {
  let player = await getUserInfo(item.player);

  item.paperid = item.id;
  item.id = item._id;
  item.player = player;
  delete item.from;
  delete item._id;
  return item;
}

async function getQList(list) {
  for(let j = list.length-1; j >=0; j--) {
    let _id = list[j],
         q = { _id };
    let res = await mongodb.findOne(COLLECTION_Q, q);
    list[j] = res.data;
    list[j].id = _id;
  }
  return list;
}

async function getUserInfo(_id) {
  let q = { _id },
       info = await mongodb.findOne(COLLECTION_USER, q);
  info && (info = info.userInfo);
  return info;
}

async function getPaper(_id) {
  let q = { _id },
       paper = await mongodb.findOne(COLLECTION_PAPERS, q);
  if(paper) {
    paper = paper.data;
    paper.id = _id;
    paper.questions = await getQList(paper.questions);
  }
  return paper;
}


// 更新测试访问量
r.post("/paper/record", async ( ctx ) => {
  let _id = ctx.request.body.id;

  let res = await mongodb.update(COLLECTION_PAPERS, {_id}, {
    $inc: {"data.record_count": 1},
  });

  ctx.body = { tip: config.SHOW_TIP };
});


// 更新测试结果是否已读
r.post("/result/record", async ( ctx ) => {
  let _id = mongodb.ObjectId(ctx.request.body.id);

  let res = await mongodb.update(COLLECTION_ANSWERS, {_id}, {
    $inc: {"record_count": 1},
  });

  ctx.body = {};
});

module.exports = r;