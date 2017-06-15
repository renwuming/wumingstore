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

const updateSync = function(collection, criteria, objNew) {
  return new Promise(function(resolve, reject) {
    collection.update(criteria, objNew, {upsert: true, multi: true}, function(err, res) {
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

async function update(collection, criteria, objNew, callback) {
  const db = await getDB();
  const col = db.collection(collection);
  try {
    let res = await updateSync(col, criteria, objNew);
    return res;
  } catch(e) {
    return e.toString();
  }
}

async function find(collection, query) {
  const db = await getDB();
  const col = db.collection(collection);
  let res = await findSync(col, query);
  return res;
}

module.exports = {
  update,
  find
}