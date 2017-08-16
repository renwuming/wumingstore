const utils = {};

deepAssign = function(obj){
  if(obj === undefined || obj === null) return obj;
  let __copy;
  if(obj instanceof Date) __copy = new Date(obj);
  else __copy = new obj.constructor();
  for(let key in obj) {
    if(!obj.hasOwnProperty(key)) continue;
    let item = obj[key];
    if(item instanceof Object) {
      __copy[key] = deepCopy(item);
    } else {
      __copy[key] = item;
    }
  }
  return __copy;
};

utils.deepAssign = deepAssign;

module.exports = utils;