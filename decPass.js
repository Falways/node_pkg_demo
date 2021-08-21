const crypto = require('crypto');
const LIC_AES_KEY="Bcdi^!#$!@#2017\0";

let conf = {};

console.log('Global config is loaded...');

var decrypt = function (key, iv, crypted) {
    crypted = Buffer.from(crypted);
    var decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    var decoded = decipher.update(crypted);
    return Buffer.concat([decoded, decipher.final()]).toString();
};

const readPassword = function (encoded) {
    let b = Buffer.from(encoded,'base64');
    let iv = Buffer.alloc(16);
    try {
        return decrypt(Buffer.from(LIC_AES_KEY), iv, b);
    } catch (e) {
        console.log(e);
        return null;
    }
}

console.log(readPassword("s8cO/P3/07ATnzVXgAsCUA=="))
