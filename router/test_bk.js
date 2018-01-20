const Router = require("koa-router");
const r = new Router();
const http = require("./lib/http");
const fs = require("fs");
const path = require("path");
const mongodb = require("./lib/mongodb");
const middleware = require("./middleware");
const Hash = require("./lib/hash.js");
const utils = require("./lib/utils.js");
const config = require("./lib/config.js");

const COLLECTION_USER = "user";
const COLLECTION_PAPERS = "papers";
const COLLECTION_FRIEND = "friendtest";
const COLLECTION_FRIEND_ANSWERS = "friendtest_answers";

const LEVEL_ID_LIST = ["","iI-DXB","",""]


r.get("/friendtest/paper/:level", middleware.getSession(), async ( ctx ) => {
  let _level = +ctx.params.level,
      id = ctx.state.openid,
      paper_id = LEVEL_ID_LIST[_level];

  let paper = await http.get(`http://localhost:9000/test/paper/${paper_id}`);
  paper = paper.feeds[0];
  let friendanswer = await getFriendAnswer(id, _level);

  ctx.body = {
    paper,
    answers: friendanswer,
  };
});

async function getFriendAnswer(id, level) {
  let obj = { _id: id };
  let str = `level${level}`;
  let ans = await mongodb.findOne(COLLECTION_FRIEND, obj);
  let res = {};
  if(ans) res = ans[str];
  else {
    let r = await mongodb.update(COLLECTION_FRIEND, obj, {"$set": {
      [str]: {},
    }});
    console.log(r);
  }
  return res ? res : {};
}

async function updateFriendAnswer(id, level, obj) {
  let res = await mongodb.update(COLLECTION_FRIEND, {_id: id}, {
    "$set": {
      [`level${level}`]: obj,
    }
  });
  console.log(res)
}

r.post("/friendtest", middleware.getSession(), async ( ctx ) => {
  let {level, qid, answer} = ctx.request.body,
      id = ctx.state.openid;
  try {
    let obj = await getFriendAnswer(id, level);
    obj[qid] = answer;

    updateFriendAnswer(id, level, obj);

    ctx.body = {
      success: true
    };
  } catch(e) {
    let error = e.toString();
    console.log(error);
    ctx.body = {
      errMsg: error,
    };
  }
});

r.post("/friendtest/result", middleware.getSession(), async ( ctx ) => {
  let {level, from, answers} = ctx.request.body,
      id = ctx.state.openid;

  const data = {
    from: await middleware.getSessionBy(from),
    player: id,
    level,
    answers,
    publish_time: +new Date()
  };
  try {
    let res = await mongodb.insert(COLLECTION_FRIEND_ANSWERS, data);
    ctx.body = {
      success: true,
    };
  } catch(e) {
    let error = e.toString();
    console.log(error);
    ctx.body = {
      errMsg: error,
    };
  }
});

// 获取友情测试结果列表
r.get("/friendtest/results", middleware.getSession(), async ( ctx ) => {
  let id = ctx.state.openid,
      list, papers = [],
      query = { from: id };
  // MASTER_USER获取所有测试结果
  if(config.MASTER_USERS.includes(query.from)) Reflect.deleteProperty(query, "from");
  list = await mongodb.find(COLLECTION_FRIEND_ANSWERS, query);
  list = await handleAnswersGet(list);
  // papers数据
  for(let i = list.length-1; i >=0; i--) {
    let __id = LEVEL_ID_LIST[list[i].level];
    let __p = await http.get(`http://localhost:9000/test/paper/${__id}`);
    __p = __p.feeds[0];
    papers.push(__p);
  }
  ctx.body = {
    results: list,
    papers
  };
});

async function handleAnswersGet(list) {
  let hash = {},
      results = [];
  for(let i = list.length-1; i >=0; i--) {
    let e = list[i],
        level = e.level;
    e = await handleAnswerGet(e);
    if(hash[level]) {
      hash[level].list.push(e);
      // 最新的publish_time
      if(e.publish_time > hash[level].publish_time) hash[level].publish_time = e.publish_time;
    } else {
      hash[level] = {
        level,
        id: LEVEL_ID_LIST[level],
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

  item.paperid = LEVEL_ID_LIST[item.level];
  item.id = item._id;
  item.player = player;
  item.answers = handleObj2Arr(item.answers);
  Reflect.deleteProperty(item, "from");
  Reflect.deleteProperty(item, "_id");
  return item;
}

function handleObj2Arr(obj) {
  let res = [];
  for(let k in obj) {
    res.push({
      id: k,
      selected: obj[k],
    });
  }
  return res;
}

async function getUserInfo(_id) {
  let q = { _id },
      info = await mongodb.findOne(COLLECTION_USER, q);
  info && (info = info.userInfo);
  return info;
}


// 更新测试结果是否已读
r.post("/friendtest/result/record", async ( ctx ) => {
  let _id = mongodb.ObjectId(ctx.request.body.id);

  let res = await mongodb.update(COLLECTION_FRIEND_ANSWERS, {_id}, {
    $inc: {"record_count": 1},
  });

  ctx.body = {};
});

module.exports = r;
