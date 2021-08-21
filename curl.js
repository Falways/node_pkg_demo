let log4js = require("log4js");
let path = require('path');
let fs = require('fs');
let request = require('request');
let logger = log4js.getLogger();
logger.level = "debug";

let config_path = path.join(process.cwd(), "config.json")
let config = {}
try {
    if (!fs.existsSync(config_path)) {
        fs.writeFileSync(config_path, JSON.stringify({"url":"", "custom":{}, "method":"GET"}, null, 4))
        return;
    }
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
            logger.info(`${config.method} url = ${url}, failure!`)
            return
        }
        logger.info("res = " + JSON.stringify(body))
        if (res.statusCode==200){
            logger.info(`${config.method} url = ${url}, successes!`)
        }
    }).on('error', function(err) {
        logger.error(err);
    })
}catch (e){
    logger.error(e)
}

