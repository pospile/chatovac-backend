console.log("Running high-security module");
var passwordHash = require('password-hash');
const TokenGenerator = require('uuid-token-generator');


exports.EncryptPassword = function (password, callback) {
    console.log("password:"+ password);
    var hashedPassword = passwordHash.generate(password);
    callback(hashedPassword);
};
exports.VerifyPassword = function (hash, password, callback) {
    callback(passwordHash.verify(password, hash));
};
exports.GenerateToken = function (callback) {
    const tokgen2 = new TokenGenerator(256, TokenGenerator.BASE62);
    var token = tokgen2.generate();
    callback(token);
};