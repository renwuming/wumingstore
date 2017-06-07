const redis = require("redis");
const client = redis.createClient(6379, "localhost");

client.print = redis.print;

client.get = function(key) {
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