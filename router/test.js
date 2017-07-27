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

  let res = await mongodb.update(COLLECTION, {
    _id: ctx.state.openid,
  }, {
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

module.exports = r;