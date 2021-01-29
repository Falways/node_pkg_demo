const { Pool } = require('pg')
const pool = new Pool({
    "host":"192.168.128.31",
    "port":"5432",
    "user":"postgres",
    "password":"",
    "database":"msdb"
})
const getFiles = (sql, done)=>{
    pool.query(sql, (err, res) => {
        if (err){
            done(err, null)
        }else {
            done(null, res.rows)
        }
    })
}
module.exports = {
    getFiles
}