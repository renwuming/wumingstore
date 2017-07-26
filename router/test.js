const Router = require("koa-router");
const r = new Router();
const mongodb = require("./lib/mongodb");
const middleware = require("./middleware");

const COLLECTION = "test";

r.post("/list", middleware.getSession(), async ( ctx ) => {
  const req = ctx.request.body;
  const query = {
      _id: ctx.state.openid
    };
  let list = (await mongodb.find(COLLECTION, query))[0];
  list = list ? list.testlist : [];
  list.push(req.item);

  let res = await mongodb.update(COLLECTION, {
    _id: ctx.state.openid,
  }, {
    $set: {
      testlist: list
    }
  });
  ctx.body = {};
});

r.get("/list", middleware.getSession(), async ( ctx ) => {
  const query = {
      _id: ctx.state.openid
    };
  let list = (await mongodb.find(COLLECTION, query))[0];
  list = list ? list.testlist : [];

  ctx.body = {
    testlist: list
  };
});

module.exports = r;