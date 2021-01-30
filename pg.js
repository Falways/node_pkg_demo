/**
 * Created by xdzhang on 2017/12/4.
 */
var pg = require('pg');
let log4js = require("log4js");
let logger = log4js.getLogger();
logger.level = "debug";
var async = require('async');
let pools={};

var DB = function(dbName) {
    if(!dbName){
        dbName='db';
    }
    this.dbName=dbName;
    this.pools=pools;
}

DB.prototype.init = function() {
    var config = {
        "host":"127.0.0.1",
        "port":"5432",
        "user":"postgres",
        "password":"",
        "database":"msdb",
        // 扩展属性
        max:20, // 连接池最大连接数
        idleTimeoutMillis:30000, // 连接最大空闲时间 30s
    }
    pools["db"]=new pg.Pool(config);

}

DB.prototype.getConnection=async function(){
    const conn = await pools[this.dbName].connect();
    return conn;
}

DB.prototype.query = function (sql, params, callback,context) {
    logger.debug("query(): sql: "+sql+",params: "+JSON.stringify(params));
    if(!context||!context.connection){
        pools[this.dbName].connect(function (err, connection,done) {
            if (err) {
                logger.error('connection error :' + err);
                callback(err, null);
                done();
                return;
            }
            connection.query(sql, params, function (err, result) {
                if (err) {
                    logger.error("Error: " + err.message);
                } else {
                    logger.debug("query() result: "+JSON.stringify(result.rows));
                }
                done();
                var rows = (result)?result.rows:null;
                callback(err, rows, result);
            });
        });
    }else{//有conn则用传进来的
        context.connection.query(sql, params, function (err, result) {
            if (err) {
                logger.error("Error: " + err.message);
            } else {
                logger.debug("query() result: "+JSON.stringify(result));
            }
            //释放连接在外面的事务里做，这里无需处理
            var rows = (result)?result.rows:null;
            callback(err, rows, result);
        });
    }
}

DB.prototype.query_page = function (sql, params, callback,countSql,sumFields,sumFieldAliases) {
    var that = this;
    var cnt_sql=countSql;
    if(!cnt_sql){
        //忽略大小写匹配
        var cnt_fields = "count(*) as total";
        if(sumFields) {
            if(!sumFieldAliases){
                sumFieldAliases=[];
            }
            for(var i = 0; i < sumFields.length; i ++) {
                var arr=sumFields[i].split('.');
                var fieldName=arr[arr.length-1];
                if(sumFieldAliases[i]){
                    fieldName=sumFieldAliases[i];
                }
                cnt_fields += ',sum('+sumFields[i]+') as '+fieldName;
            }
        }
        cnt_sql = 'select '+cnt_fields+' from '  + sql.substring(sql.toLowerCase().lastIndexOf(' from ') + 6, sql.toLowerCase().indexOf(' limit'));
        if(sql.toLowerCase().lastIndexOf('order by')>0){//包含order by的查询
            cnt_sql='select '+cnt_fields+' from '  + sql.substring(sql.toLowerCase().lastIndexOf(' from ') + 6, sql.toLowerCase().indexOf('order by'));
        }
        if(sql.toLowerCase().lastIndexOf('group by')>0){//包含group by的查询
            cnt_sql='select '+cnt_fields+' from ('+sql.substring(0, sql.toLowerCase().indexOf(' limit'))+') group_sel';
        }
    }

    var cnt_params = params.slice(0, params.length - 2);
    that.query(cnt_sql, cnt_params, function (err, data) {
        if (err) {
            callback(err, null);
            return;
        }
        var total = data[0].total;
        var sum = {};
        if(sumFields) {
            for(var i = 0; i < sumFields.length; i ++) {
                var arr=sumFields[i].split('.');
                var fieldName=arr[arr.length-1];
                if(sumFieldAliases[i]){
                    fieldName=sumFieldAliases[i];
                }
                sum[fieldName] = data[0][fieldName];
            }
        }
        that.query(sql,params,function(err,data2) {
            var result = {};
            result.total = total;
            result.page = data2;
            result.sum = sum;
            callback(err,result);
        })
    });
}

DB.prototype.map_insert_sql = function (name,record) {
    var sql = "insert into " + name+"(";
    var s = "";
    var params = [];
    var i = 1;
    for(var k in record) {
        sql += k+",";
        if (record[k] instanceof Object) {
            params.push(JSON.stringify(record[k]));
        } else {
            params.push(record[k]);
        }
        s += "$"+i+",";
        i ++;
    }
    sql = sql.substring(0,sql.length-1)+")";
    s = s.substring(0, s.length-1);
    sql += " values("+s+")";
    return {sql:sql,params:params};
}

DB.prototype.insert_many = function (name,records, callback,context) {
    var that = this;
    if(!records || records.length === 0) {
        callback(null,[]);
        return ;
    }
    async.eachSeries(records, function (item, done) {
        var map = that.map_insert_sql(name,item);
        that.query(map.sql, map.params, function (err, data) {
            if(err) {
                logger.error(err);
                done(err);
                return;
            }
            if(data) {
                item.id = data.insertId;
            }
            done(null);
        },context);
    }, function done(err) {
        callback(err,records);
    });
}
module.exports = function(dbName) {
    var db =  new DB(dbName);
    db.init();
    db.getConnection();
    return db;
}