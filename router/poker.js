const Router = require("koa-router");
const r = new Router();
const mongodb = require("./lib/mongodb");
const middleware = require("./middleware");


r.post("/saveBest", middleware.getSession(), async ( ctx ) => {
  const req = ctx.request.body;
  await mongodb.save("poker", {
    _id: ctx.state.openid,
    data: req.data
  }, function(res) {
    console.log(res.result);
  });
});

r.post("/best", middleware.getSession(), async ( ctx ) => {
  const req = ctx.request.body;
  const query = {
    _id: ctx.state.openid
  };
  let res = await mongodb.find("poker", query);
  ctx.body = res[0].data;
  // ctx.body = "res[0].data";
});

module.exports = r;
