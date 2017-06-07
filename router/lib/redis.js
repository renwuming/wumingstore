const redis = require("redis");
const client = redis.createClient(6379, "localhost");

client.print = redis.print;

module.exports = client;