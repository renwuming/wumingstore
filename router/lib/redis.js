const config = require("./config");
const redis = require("redis");
const client = redis.createClient(config.REDIS_PORT, config.REDIS_IP, config.REDIS_OPTIONS);
const DATABASE = "0";
const EXPIRE_TIME = 3600 * 24 * 31; // 有效期31天

client.print = redis.print;

client.getSync = function(key) {
  return new Promise(function(resolve, reject) {
    client.select(DATABASE, function(error){
      if(error) {
        reject(error);
      } else {
        client.get(key, function(error, res) {
          if(error) {
            reject(error);
          } else {
            resolve(res);
          }
        });
      }
    });
  });
}

function setData(key, value) {
  return new Promise(function(resolve, reject) {
    client.select(DATABASE, function(error){
      if(error) {
        reject(error);
      } else {
        client.set(key, JSON.stringify(value), function(error, res) {
          if(error) {
            reject(error);
          } else {
            resolve(res);
          }
        });
      }
    });
  });
}

client.setSync = async function(key, value) {
  await setData(key, value);
  client.expire(key, EXPIRE_TIME);
}


module.exports = client;