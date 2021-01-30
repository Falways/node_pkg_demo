let request = require('request');
let fs = require('fs');
let path = require('path')
let config = null;

Date.prototype.Format = function (fmt) { //author: meizz
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

let log4js = require("log4js");
let logger = log4js.getLogger();
logger.level = "debug";

const postData = (url,data)=>{
    logger.info(`post url = ${url}`)
    request.post(url,{
        json:true,
        body: data,
        timeout: 5000,
        verifySSL: false
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
}

const watchFile = (fp, data, score)=>{
    fs.watchFile(fp,(current, prv)=>{
        if (current.mtime != prv.mtime){
            logger.info(`File ${fp} changed, set score = ${score}, notify server...`)
            data.data.score = score
            postData(config.server_addr, data)
        }
    })
}

const pullServerSetWatchFile = (pull_server_addr, done)=>{
    logger.info("download watch file config form: " +pull_server_addr)
    request(pull_server_addr,{
        method:"GET",
        timeout: 5000,
        json:true,
        verifySSL: false
    },(error, res, body)=>{
        if (error){
            logger.error(error)
            done(null)
        }else {
            logger.info(JSON.stringify(body))
            try {
                let obj = {}
                body.data.forEach(item=>{
                    obj[item["fp"]]=item.score;
                })
                done(obj)
            }catch (e){
                logger.error(e)
                done(null)
            }
        }
    })
}

const startWorker = () =>{
    try {
        logger.info("Build by pkg at 2021/1/29 20:00!")
        // 在pkg中使用__dirname获取的snapshoot(快照)路径, __dirname要替换成process.cwd()
        config = fs.readFileSync("C:\\config.json").toString()
        config = JSON.parse(config)
        logger.info(config)
        let data = config.post_data
        pullServerSetWatchFile(config.service_config, function (mf){
            if (!mf){
                logger.error("connect server download config failure, abort!")
                logger.info("process will exit, after 5s!")
                setTimeout(()=>{
                    process.exit(0)
                },5000)
                return
            }
            for (let key in mf){
                logger.info("start watch file: "+key+", value")
                watchFile(key, data, mf[key])
            }
        })
    }catch (e){
        logger.error(e)
    }
}

startWorker()




