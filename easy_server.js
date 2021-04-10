let express = require("express")
let http_log = require('morgan')
let log4js = require("log4js");
let path = require('path');
let fs = require('fs');
let logger = log4js.getLogger();
let request = require('request');
logger.level = "debug";
let app = express()
app.use(http_log('dev'))
app.use(express.json())
// __dirname 对应 process.cwd()
let config_path = path.join(process.cwd(), "config.json")
let config = {
    "is_reimburse":"Y",
    "is_approval":"Y",
    "is_finance":"N",
    "cookie":"user_login=1; token=d2ViLDM2MDAscVRRY20yNkZPaG5Gb3JJbHNnRXpuR2docitWd3NjaUF1d2VZL3h4SzNDKzAwaVVmaFdrYnJhOGcyNXM1bXlxRm1pUks0ZjdKS1pENHYzWmo1d1RUUEE9PQ; u_usercode=00331221; u_logints=1618021926959; tenantid=cmer_test; pk_user=4a9efa24-f5aa-42c7-b886-b47fc7aff191; userid=7d7a5146-2128-42c3-8b93-afddb8d93f73",
    "status":0,
    "url": "http://10.117.25.4:18060/yybter/sdplogin/login?usercode="
}

try {
    config = fs.readFileSync(config_path).toString()
    config = JSON.parse(config)
    logger.info(config)
}catch (e){
    logger.error(e)
}

app.post("/yybter",(req,res,next)=>{
    logger.debug("req==>yybter")
    res.json(
        config
    )
})

app.post("/getCookie",(req,res,next)=>{
    let query = req.query;
    let url = config.url+query.usercode
    logger.info(`post url = ${url}!`)
    request({
        uri: url,
        json:true,
        method:"POST",
        timeout: 5000,
        verifySSL: false
    },function (error, _res, body){
        if (error){
            logger.error(error)
            logger.info(`post url = ${url}, failure!`)
            return
        }else {
            logger.info(`post url = ${url}, successes!`)
        }
        logger.info("res = " + JSON.stringify(body))
        body.cookie = body.cookie.replace("cmer_test;", "cmer_test_cs;")
        res.json(body)
        logger.debug("final send data: " + JSON.stringify(body))
    }).on('error', function(err) {
        logger.error(err);
        res.json(config)
    })
})

app.listen(3003)
logger.debug("service listen at, curl http://127.0.0.1:3003/yybter")
