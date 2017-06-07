const redis = require("redis");
const client = redis.createClient(6379, "localhost");
// const client = redis.createClient(6379, "123.207.218.212");

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

module.exports = client;