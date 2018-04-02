const Router = require("koa-router");
const r = new Router();
const _ = require("lodash");
const http = require("./lib/http");
const fs = require("fs");
const path = require("path");
const mongodb = require("./lib/mongodb");
const getDB = mongodb.getDB;
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


r.get("/results", async ( ctx ) => {
  let db = await getDB(),
      list = await db.collection(COLLECTION_ANSWERS).find().sort({publish_time: -1}).toArray(),
      res = {};
  for(let i=0; i<list.length; i++) {
    let item = list[i];
    list[i] = await handleResult(item);
  }
  res = list.reduce((results, next) => {
    let {id} = next;
    (results[id] || (results[id] = [])).push(next);
    return results;
  }, {});

  // 按照from用户分组
  // for(let k in res) {
  //   let l = res[k];
  //   l.sort((a,b) => comparefn(a.from,b.from));
  // }

  ctx.body = res;
});


async function getQList(list) {
  let db = await getDB();
  for(let j = list.length-1; j >=0; j--) {
    let _id = list[j],
         q = { _id };
    let res = await db.collection(COLLECTION_Q).findOne(q);
    list[j] = res.data;
    list[j].id = _id;
  }
  return list;
}

async function getPaper(_id) {
  let q = { _id },
      db = await getDB(),
      paper = await db.collection(COLLECTION_PAPERS).findOne(q);
  if(paper) {
    paper = paper.data;
    paper.id = _id;
    paper.questions = await getQList(paper.questions);
  }
  return paper;
}

async function handleResult(data) {
  let {from, player, id} = data;
  // 处理user信息
  data.from = await getUserInfo(from);
  data.player = await getUserInfo(player);
  // 处理paper信息
  data.paper = await getPaper(id);
  return data;
}

async function getUserInfo(_id) {
  let db = await getDB(),
      info = await db.collection(COLLECTION_USER).findOne({ _id });
  info && (info = info.userInfo);
  return info;
}

 const comparefn = function (x, y) {
  if (x == y) return 0;
  else return x < y ? -1 : 1;
};

module.exports = r;
