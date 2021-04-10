let request = require('request');
let fs = require('fs');
let path = require('path');
let log4js = require("log4js");
let logger = log4js.getLogger();
logger.level = "debug";

const loadConfig = ()=>{
    try {
        // __dirname 对应 proccess.cwd()
        let config_path = path.join(process.cwd(), "config.json")
        let write_path = path.join(process.cwd(), "result.txt")
        let config = fs.readFileSync(config_path).toString()
        logger.info(config)
        config = JSON.parse(config)
        let reqAddr = config.reqAddr
        logger.debug("req addr = " + reqAddr)
        request({
            uri: reqAddr,
            json:true,
            method:"POST",
            timeout: 5000,
            verifySSL: false
        }, function (err,res,body){
            if (err){
                logger.debug("Req failure!")
                logger.error(err);
            }else {
                logger.debug("Req Successfully!")
                logger.info(body)
                logger.info(typeof body)
                logger.debug("res.statusCode = " + res.statusCode)
                logger.info(JSON.stringify(body))
                fs.writeFileSync(write_path, body)
            }
        })
    }catch (e){
        logger.error(e)
    }
}

loadConfig()
