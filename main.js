let request = require('request');
let fs = require('fs');
let path = require('path')
let config = null;
let minScore = 100

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
    if (minScore < data.data.score){
        data.data.score = minScore
    }else if (data.data.score < minScore){
        minScore = data.data.score
    }
    logger.info("minScore = " + minScore)

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
            // const mockRes = {'C:\\Windows\\System32\\drivers\\etc': 40, 'C:\\Windows\\System32\\drivers\\networks': 30}
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
    logger.info("Build by pkg at 2021/1/29 20:00!")
    setTimeout(()=>{
        try {
            logger.info("start run...")
            // 在pkg中使用__dirname获取的snapshoot(快照)路径, __dirname要替换成process.cwd()
            config = fs.readFileSync("C:\\config.json").toString()
            config = JSON.parse(config)
        }catch (e){
            logger.error(e)
            config = {
                "post_data": {
                    "status":"success",
                    "code":"1000",
                    "message":"执行成功",
                    "data":
                        {
                            "ip":"192.168.18.188",
                            "devOnlyId":"test1",
                            "score":"62",
                            "clientTime ":"2019-12-11 18:2:39",
                            "deviceType":"0",
                            "vmClientIp":"null"
                        }
                },
                "server_addr": "http://192.168.92.28:10092/api/v1/setRiskValue",
                "service_config": "http://192.168.92.28:3001/sdp_score_file"
            }
        }

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
            let lock_score = config.lock_score
            if (lock_score){
                logger.info("all file set common score = " + lock_score)
            }
            for (let key in mf){
                logger.info("start watch file: "+key+", value")
                watchFile(key, data, lock_score?lock_score:mf[key])
            }
        })
    }, 3000)
}

startWorker()




