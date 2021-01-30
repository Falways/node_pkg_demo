let express = require("express")
let http_log = require('morgan')
let log4js = require("log4js");
let logger = log4js.getLogger();
logger.level = "debug";
let c_pg = require('./pg')()
let app = express()
app.use(http_log('dev'))
app.use(express.json())

app.get("/sdp_score_file",(req,res)=>{

    c_pg.query("select * from sdp_file_score",[],function (err, data) {
        if (err){
            res.json({err, data:""})
        }else {
            res.json({err:"",data})
        }
    })
})

app.listen(3001)
logger.debug("service listen at, curl http://127.0.0.1:3001/sdp_score_file")
