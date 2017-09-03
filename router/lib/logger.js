const log4js = require('log4js');
log4js.configure({
  appenders: {
    logs: {
      type: 'dateFile',
      filename: 'logs/wumingstore',
      pattern: '-yyyy-MM-dd.log',
      alwaysIncludePattern: true,
    },
    console: { type: 'console' }
  },
  categories: {
    default: { appenders: ['console', 'logs'], level: 'info' }
  }
});

let logger;

// 单例模式
function getLogger() {
  if(!logger) {
    logger = log4js.getLogger("log");
    logger.level = 'info';
    return logger;
  } else return logger;
}

function log(ctx, time) {
  let { method, url, body: request, query } = ctx.request,
       { status, body: response } = ctx.response,
       str = JSON.stringify;
  switch(method) {
    case "GET":
    case "DELETE":
      getLogger().info('%s %s %s - %sms\r\nRequest: %s\r\n\r\n', method, status, url, time, str(query));
      break;
    case "POST":
    case "PUT":
      getLogger().info('%s %s %s - %sms\r\nRequest: %s\r\nResponse: %s\r\n\r\n', method, status, url, time, str(request), str(response));
      break;
    default:
    break;
  }
}

module.exports = async function(ctx, next) {
  let start = new Date, time;
  await next();
  time = new Date - start;
  log(ctx, time);
};

