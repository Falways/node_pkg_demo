let request = require('request')
let log4js = require("log4js");
let logger = log4js.getLogger();
logger.level = "debug";
const SocksProxyAgent = require('socks-proxy-agent');
let socksAgent = new SocksProxyAgent('socks://127.0.0.1:2080');
let _reqUrl = 'http://aiportal.unicom.local/portal/v1/eipredirect.html?pid=MjkD0usjwW2lcf+kfBFCzxvmYhYecr8OLXyUX7Kp+1U=&token=u7NBbfeO5FpAtr61T9IL0VEENkF+1vmopUuxxxksTwg=&respUrl=http%3A%2F%2Faiportal.unicom.local%2Fportal%2Fv1%2Findex.html%3F_%3D20210820&isfirst=0&islogin=false&_=20210820'
let a_url = 'http://sso.portal.unicom.local/eip_sso/rest/authentication/eip_login?appid=na186&success=http://service.aiportal.unicom.local//ssoclient/ssologin%3Faction%3Dlogin&error=http://sso.portal.unicom.local/eip_sso/aiportalLogin.html&return=http://sso.portal.unicom.local/eip_sso/aiportalLogin.html'

let headers = {
    host: 'sso.portal.unicom.local',
    'x-real-ip': '127.0.0.1',
    'x-scheme': 'http',
    connection: 'close',
    'cache-control': 'max-age=0',
    'sec-ch-ua': '"Chromium";v="92", " Not A;Brand";v="99", "Google Chrome";v="92"',
    'sec-ch-ua-mobile': '?0',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'sec-fetch-site': 'none',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-user': '?1',
    'sec-fetch-dest': 'document',
    'accept-encoding': '',
    'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
    cookie: 'ts_uid=5000627080;'
}

request({
    headers,
    method:'GET',
    agent:socksAgent,
    "url": _reqUrl,
    "strictSSL":false
}, function (error, res, body) {
    if (error){
        logger.error(error)
        return
    }
    logger.info(res.statusCode)
    logger.info(res.headers)
    logger.info("res = " + body)
    if (res.statusCode==200){
        logger.info(` successes!`)
    }
})
