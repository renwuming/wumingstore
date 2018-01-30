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
  let pid = ctx.request.query.pid,
      id = ctx.state.openid;

  let paper = await http.get(`http://localhost:9000/test/paper/${pid}`);
  if(paper) paper = paper.feeds[0];
  let answers = await getFriendAnswer(id);

  ctx.body = {
    paper,
    answers,
  };
});

module.exports = r;
