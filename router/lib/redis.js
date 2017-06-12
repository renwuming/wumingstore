const redis = require("redis");
const client = redis.createClient(6379, "localhost");
// const client = redis.createClient(6379, "123.207.218.212");

const EXPIRE_TIME = 3600*24*7;

client.print = redis.print;

client.getSync = function(key) {
  return new Promise(function(resolve, reject) {
    client.get(key, function(error, res) {
      if(error) {
        reject(error);
      } else {
        resolve(res);
      }
    });
  });
}

function setData(key, value) {
  return new Promise(function(resolve, reject) {
    client.set(key, JSON.stringify(value), function(error, res) {
      if(error) {
        reject(error);
      } else {
        resolve(res);
      }
    });
  });
}

client.setSync = async function(key, value) {
  await setData(key, value);
  client.expire(key, EXPIRE_TIME); // 有效期一星期
}


module.exports = client;