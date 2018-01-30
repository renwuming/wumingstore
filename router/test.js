const Router = require("koa-router");
const r = new Router();
const fs = require("fs");
const path = require("path");
const mongodb = require("./lib/mongodb");
const middleware = require("./middleware");
const Hash = require("./lib/hash.js");
const utils = require("./lib/utils.js");
const config = require("./lib/config.js");

const COLLECTION_USER = "user";
const COLLECTION_PAPERS = "papers";
const COLLECTION_Q = "questions";
const COLLECTION_ANSWERS = "answers";
const COLLECTION_FRIEND = "friendtest";
const COLLECTION_FRIEND_ANSWERS = "friendtest_answers";

const DATA_LENGTH = 5;

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
      _datatype = +ctx.request.query.datatype || 0,
      has_more,
      query = {
        ["data.datatype"]: _datatype,
      };
  if(_lastkey !== 0) {
    query["data.publish_time"] = {
      $lt: _lastkey
    };
  }

  let list = await mongodb.sort(COLLECTION_PAPERS, query, {"data.publish_time": -1});

  has_more = list.length > DATA_LENGTH;
  if(list.length) {
    list = list.slice(0, DATA_LENGTH);
    _lastkey = list[list.length-1].data.publish_time;
    await handlePaperGet(list);
  }
  let body = {
    has_more,
    last_key: _lastkey,
    feeds: list
  };
  if(_datatype) {
    let _id = await middleware.getSessionBy(ctx.request.query.sessionid);
    let ansObj = await getFriendAnswer(_id);
    body.answers = ansObj;
  }
  ctx.body = body;
});

async function getFriendAnswer(id) {
  let query = { _id: id };
  let ans = await mongodb.findOne(COLLECTION_FRIEND, query);
  let res;
  if(ans) res = ans.answers;
  else res = {};
  return res;
}

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
    Reflect.deleteProperty(item, "_id");
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
      _datatype = +ctx.request.query.datatype || 0,
      has_more,
      query = {
        from: ctx.state.openid
      },
      list, papers = [],
      collectionHash = {
        0: COLLECTION_ANSWERS,
        1: COLLECTION_FRIEND_ANSWERS,
      };
  // MASTER_USER获取所有测试结果
  if(config.MASTER_USERS.includes(query.from)) Reflect.deleteProperty(query, "from");

  list = await mongodb.find(collectionHash[_datatype], query);
  list = await handleAnswersGet(list, _datatype);
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

async function handleAnswersGet(list, datatype) {
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
        publish_time: e.publish_time,
        datatype,
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
  Reflect.deleteProperty(item, "from");
  Reflect.deleteProperty(item, "_id");
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
