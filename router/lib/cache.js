const NodeCache = require("node-cache")
let cache

function getCache() {
    if(!cache) {
        cache = new NodeCache()
        return cache
    } else return cache
}


module.exports = getCache