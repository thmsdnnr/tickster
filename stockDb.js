var MongoClient = require('mongodb').MongoClient;
var ObjectID=require('mongodb').ObjectID;
let db;
let dbUrl=process.env.PROD_DB||'mongodb://localhost:27017/';

function connect(callback) {
  if (db===undefined) {
    MongoClient.connect(dbUrl, function(err, database){
      if(err) { return callback(err) };
      db=database;
      callback(null, db);
  });
  }
  else { callback(null, db); }
}

connect(function(status){console.log(status);});

exports.fetchStocks = function(cb) {
  db.collection("stocks").find({}).toArray(function(err, docs) {
    if(!err) { (docs.length) ? cb(docs) : cb(null); }
        });
    }

exports.fetchOneStock = function(data,cb) {
      db.collection("stocks").find({tickerURL:data.tickerURL}).toArray(function(err, docs) {
        if(!err) { (docs.length) ? cb(docs) : cb(null); }
          });
      }

exports.saveStock = function(data,cb) {
  cb(db.collection("stocks").insert({tickerURL:data.tickerURL, data:data.data, stockAdded:new Date()}));
  }

exports.deleteStock = function(data,cb) {
  db.collection("stocks").deleteOne({tickerURL:data.tickerURL});
  cb();
  }
