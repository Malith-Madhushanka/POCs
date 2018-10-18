import Promise from 'bluebird';

let _connectResolve = null;
let _connectReject = null;

let onRedisConnected = new Promise((resolve, reject) => {
    _connectResolve = resolve;
    _connectReject = reject;
 });
let _connectMongoResolve = null;
let onMongoConnected = new Promise((resolve, reject) => {
    _connectMongoResolve = resolve;
    _connectReject = reject;
 });
 
 let Redis = require("redis");
 let RedisClient = Redis.createClient();

 Promise.promisifyAll(Redis.RedisClient.prototype);
 Promise.promisifyAll(Redis.Multi.prototype);

 var mongodb = require('mongodb');
 var MongoClient = mongodb.MongoClient;
 var Collection = mongodb.Collection;
 
 Promise.promisifyAll(Collection.prototype);
 Promise.promisifyAll(MongoClient);

//  const dbName = 'TelogisRouteData';
//  const url = process.env.URL;
//  const collectionName = 'routeDataCollection013';
//  const collection = MongoClient.db(dbName).collection(collectionName);

 

function getRedisData(){
    return RedisClient.on('connect', _connectResolve);
}

function getMongoData(){
    return MongoClient.connect('mongodb://localhost:27017/', (err, db) => {
        if (err) {
            _connectReject(err);
        } else {
            _connectMongoResolve(db);
        }
    });;
}


function getMongoData(){
    return new Promise((resolve, reject) => { 
        MongoClient.connect('mongodb://localhost:27017/', (err, db) => {
            if (err) { 
                reject(err); 
            } else { 
                resolve(db);
             }
        });
    });
}


onMongoConnected.then((_db) => {
    return new Promise((resolve, reject) => {
        _db.db('TelogisRouteData').collection('routeDataCollection013_copy').find({}).toArray((error, result) => {
            _db.close();
            resolve(result);
        });
     });
}).then((_data) => {
    return _data;
})

onRedisConnected.then(() => {
    var data =  RedisClient.getAsync("2018-03-15");
    RedisClient.quit();
    return data;
})
.then((_data) => {
    var data = JSON.parse(_data);
    return data;
})
.then((_redisData) => {
    return _redisData;
});

// console.log(getMongoData());
// console.log(getRedisData());

var functions = [ getRedisData(), getMongoData() ];

Promise.all(functions)
.then(results => {
    console.log(results[0]);
    console.log(results[1]);
}).finally(() => {
    
});