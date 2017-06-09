const client = require("mongodb").MongoClient;
const DB_CONN_STR = "mongodb://localhost:27017/test";

let DB;

const connect = function(conn_str) {
  return new Promise(function(resolve, reject) {
    client.connect(conn_str, function(err, db) {
      console.log("mongodb connect success!");
      if(err) {
        reject(err);
      } else {
        resolve(db);
      }
    });
  });
}

async function getDB() {
  if(DB) {
    return DB;
  } else {
    DB = await connect(DB_CONN_STR);
    return DB;
  }
}

const saveSync = function(collection, data) {
  return new Promise(function(resolve, reject) {
    collection.save(data, function(err, res) {
      if(err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}

const findSync = function(collection, query) {
  return new Promise(function(resolve, reject) {
    collection.find(query).toArray(function(err, res) {
      if(err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}

async function save(collection, data, callback) {
  const db = await getDB();
  const col = db.collection(collection);
  let res = await saveSync(col, data);
  return res;
}

async function find(collection, query) {
  const db = await getDB();
  const col = db.collection(collection);
  let res = await findSync(col, query);
  return res;
}

module.exports = {
  save,
  find
}