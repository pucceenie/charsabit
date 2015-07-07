var mongoose = require('mongoose');
var dbPort = 27017;
var dbHost = 'localhost';
var dbName = 'Charsabit';

//establish the database connection
var connectionString = 'mongodb://'+ dbHost +':'+ dbPort +'/' + dbName;
mongoose.connect(connectionString);
var db = mongoose.connection;

module.exports = db;



