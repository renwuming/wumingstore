const request = require('request-promise');

const http = {};

http.get = function(url, params, headers) {
  return new Promise(function(resolve, reject) {
    const options = {
      uri: url,
      qs: params,
      headers: headers,
      json: true
    };
    request(options).then(function(res) {
      console.log("http get [%s] : %s", JSON.stringify(options), res ? "OK" : JSON.stringify(res));
      resolve(res);
    }).catch(function(e) {
      console.error("http get [%s] fail", JSON.stringify(options), e.statusCode);
      reject(e);
    });
  });
}

module.exports = http;