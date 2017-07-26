const Router = require("koa-router");
const r = new Router();
const mongodb = require("./lib/mongodb");
const middleware = require("./middleware");

const COLLECTION = "test";

r.post("/item", middleware.getSession(), async ( ctx ) => {
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

module.exports = r;