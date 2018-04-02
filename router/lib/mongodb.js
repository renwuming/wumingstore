const ObjectId = require('objectid');
const client = require("mongodb").MongoClient;
const DB_CONN_STR = "mongodb://localhost:27017/test";

const options = {
    server: {
        auto_reconnect: true,
        poolSize: 10
    }
};

let DB;

const connect = function(conn_str) {
  return new Promise(function(resolve, reject) {
    client.connect(conn_str, options, function(err, db) {
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

// 支持insertMany
const insertSync = function(collection, objNew) {
  const arrayFlag = objNew instanceof Array;
  return new Promise(function(resolve, reject) {
    if(arrayFlag) {
      collection.insertMany(objNew, function(err, res) {
        if(err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    } else {
      collection.insert(objNew, function(err, res) {
        if(err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    }
  });
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

const findSync = function(collection, query, one, sort) {
  return new Promise(function(resolve, reject) {
    if(one) {
      collection.findOne(query, function(err, res) {
        if(err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    } else {
      collection.find(query).sort(sort).toArray(function(err, res) {
        if(err) {
          reject(err);
        } else {
          resolve(res);
        }
      });
    }
  });
}

const removeSync = function(collection, criteria) {
  return new Promise(function(resolve, reject) {
    collection.remove(criteria, function(err, res) {
      if(err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}

async function remove(collection, criteria) {
  const db = await getDB();
  const col = db.collection(collection);
  try {
    let res = await removeSync(col, criteria);
    return res;
  } catch(e) {
    return e.toString();
  }
}

async function insert(collection, objNew) {
  const db = await getDB();
  const col = db.collection(collection);
  try {
    let res = await insertSync(col, objNew);
    return res;
  } catch(e) {
    return e.toString();
  }
}

async function update(collection, criteria, objNew) {
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

async function findOne(collection, query) {
  const db = await getDB();
  const col = db.collection(collection);
  let res = await findSync(col, query, true);
  return res;
}

async function sort(collection, query, sort) {
  const db = await getDB();
  const col = db.collection(collection);
  let res = await findSync(col, query, false, sort);
  return res;
}

module.exports = {
  insert,
  update,
  find,
  sort,
  findOne,
  remove,
  ObjectId,
  getDB,
}