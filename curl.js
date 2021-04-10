let log4js = require("log4js");
let path = require('path');
let fs = require('fs');
let request = require('request');
let logger = log4js.getLogger();
logger.level = "debug";

let config_path = path.join(process.cwd(), "config.json")
let config = {}
try {
    config = fs.readFileSync(config_path).toString()
    config = JSON.parse(config)
    logger.info(config)
    let url = config.url
    request({
        uri: url,
        method: config.method,
        timeout: 5000,
        verifySSL: false,
        ...config.custom
    },function (error, res, body){
        if (error){
            logger.error(error)
            logger.info(`post url = ${url}, failure!`)
            return
        }
        logger.info("res = " + JSON.stringify(body))
        if (res.statusCode==200){
            logger.info(`post url = ${url}, successes!`)
        }
    }).on('error', function(err) {
        logger.error(err);
    })
}catch (e){
    logger.error(e)
}
