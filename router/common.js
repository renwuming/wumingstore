const Router = require("koa-router");
const r = new Router();

const WXBizDataCrypt = require('./WXBizDataCrypt');
const AppID = 'wx78bc21b55d1cc0c5';

r.post("/decryptedData", async ( ctx ) => {
  const req = ctx.request.body;
  const pc = new WXBizDataCrypt(AppID, req.sessionKey);
  let data;
  try {
    data = pc.decryptData(req.encryptedData, req.iv);
  } catch(e) {
    data = e;
  }

console.log('解密后 data: ', data)

  ctx.body = data;
});

module.exports = r;