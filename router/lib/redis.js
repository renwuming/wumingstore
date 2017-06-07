const redis = require("redis");
const client = redis.createClient(6379, "localhost");

clinet.print = redis.print;

module.exports = client;