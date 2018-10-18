'use strict';
import { getAllJobs } from './store';
import moment from 'moment';
var Promise = require("bluebird");


const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/Test01";
const dbName = 'Task01';
const collectionName = 'collection' + opco;
let db = null;

let args = process.argv.slice(2);

let yesterDay  = moment(new Date()).add(-1,'days').format('YYYY-MM-DD');
let toDay  = moment(new Date()).format('YYYY-MM-DD');


let opcoId = args[0] || "013";
let fromDate = args[1] || yesterDay;
let toDate = args[2] || toDay;
let routeStatus = args[3] || "Complete";

let dates = [];

var a = fromDate;
var b = toDate;

for (var m = moment(a); m.isBefore(b); m.add(1, 'days')) {
    let date = m.clone();
    let date0 = date.format('YYYY-MM-DD');
    let date1 = date.add(1, 'days').format('YYYY-MM-DD');
    dates.push({
        from  : date0,
        to : date1
    });
}

async function push(value) {
    console.log('upserting documents count : ', value.length);
    db = await MongoClient.connect(url, function(err, client) {
        if(!err){
            const db = client.db(dbName);
            var collection = db.collection(collectionName);

            for(var i in value){
                var document = value[i];

                document.lastModifiedDate = new Date().toJSON();
                document.opcoId = opcoId;
                

                collection.update(
                    {
                        "JobKey" : document.JobKey
                    },
                    document,
                    {
                        upsert: true, 
                        safe: false
                    },
                    function(err,data){
                        if (err){
                            console.log(err);
                        }else{
                            //console.log(document.JobKey);
                        }
                    }
                );
            }
            client.close();
        }
    });
    console.log('completed');
}

Promise.each(dates, function(date) {
    console.log(date);
    return getAllJobs({
        opcoId:opcoId,
        fromDate:date.from,
        toDate:date.to,
        routeStatus:routeStatus
    })
    .then(function(value) {
        return push(value);
    });
})
.then(function(data) {
  console.log('total days ; ' + data.length);
});
