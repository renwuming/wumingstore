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
const COLLECTION_FRIEND = "friendtest";
const COLLECTION_FRIEND_ANSWERS = "friendtest_answers";


async function updateFriendAnswer(id, obj) {
  let res = await mongodb.update(COLLECTION_FRIEND, {_id: id}, {
    "$set": {
      answers: obj,
    }
  });
}

async function getFriendAnswer(id) {
  let query = { _id: id };
  let ans = await mongodb.findOne(COLLECTION_FRIEND, query);
  let res;
  if(ans) res = ans.answers;
  else res = {};
  return res;
}
// 上传我的答案
r.post("/friendtest", middleware.getSession(), async ( ctx ) => {
  let {qid, answer} = ctx.request.body,
      id = ctx.state.openid;
  try {
    let obj = await getFriendAnswer(id);
    obj[qid] = answer;

    updateFriendAnswer(id, obj);

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

// 上传鉴定结果
r.post("/friendtest/result", middleware.getSession(), async ( ctx ) => {
  let {pid, from, answers} = ctx.request.body,
      id = ctx.state.openid,
      answerslist = [];
  for(let k in answers) {
    answerslist.push({
      id: k,
      selected: answers[k],
    });
  }
  const data = {
    from: await middleware.getSessionBy(from),
    player: id,
    id: pid,
    answers: answerslist,
    publish_time: +new Date(),
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

// 更新测试结果是否已读
r.post("/friendtest/result/record", async ( ctx ) => {
  let _id = mongodb.ObjectId(ctx.request.body.id);

  let res = await mongodb.update(COLLECTION_FRIEND_ANSWERS, {_id}, {
    $inc: {"record_count": 1},
  });

  ctx.body = {};
});

// 获取某个friendtest paper
r.get("/friendtest/paper", middleware.getSession(), async ( ctx ) => {
  let { from, pid } = ctx.request.query,
      id = ctx.state.openid,
      fromId = await middleware.getSessionBy(from);

  let paper = await http.get(`http://localhost:9000/test/paper/${pid}`);
  if(paper) paper = paper.feeds[0];
  let answers = await getFriendAnswer(fromId);
  let user = await getUserInfo(fromId);

  ctx.body = {
    paper,
    answers,
    user,
  };
});

// 获取某个friendtest paper的近期答案列表
r.get("/friendtest/result", middleware.getSession(), async ( ctx ) => {
  let { pid, from } = ctx.request.query,
      id = ctx.state.openid,
      fromId = await middleware.getSessionBy(from),
      query = {
        id: pid,
        from,
      };

  let rlist = await mongodb.sort(COLLECTION_FRIEND_ANSWERS, query, {"publish_time": -1});
  let hash = {}, list = [];
  for(let item of rlist) {
    let player = item.player;
    if(player == id) continue;
    if(!hash[player]) {
      hash[player] = await handleResult(item);
    }
    if(Object.keys(hash).length>=4) break;
  }

  for(let k in hash) {
    list.push(hash[k]);
    if(list.length>=5) break;
  }

  ctx.body = {
    list,
  };
});

async function handleResult(item) {
  item.player = await getUserInfo(item.player);
  let ansObj = await getFriendAnswer(item.from),
      answers = item.answers,
      len = 0,
      l = 0;
  for(let e of answers) {
    let id = e.id,
        ans = ansObj[id];
    if(ans || ans == 0) len++;
    if(ans == e.selected) l++;
  }

  let res = Math.floor(l / len * 100);
  if(isNaN(res)) res = 0;
  item.score = res;

  delete item._id;
  delete item.from;
  delete item.id;
  return item;
}

async function getFriendAnswer(id) {
  let query = { _id: id };
  let ans = await mongodb.findOne(COLLECTION_FRIEND, query);
  let res;
  if(ans) res = ans.answers;
  else res = {};
  return res;
}

async function getUserInfo(_id) {
  let q = { _id },
      info = await mongodb.findOne(COLLECTION_USER, q);
  info && (info = info.userInfo);
  return info;
}

module.exports = r;
