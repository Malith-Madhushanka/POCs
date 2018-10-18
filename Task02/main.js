'use strict';
import { getAllJobs } from './store';
import moment from 'moment';
import Promise from 'bluebird';

const MongoClient = require('mongodb').MongoClient;
const dbName = 'TelogisRouteData';
const url = process.env.URL;

let db = null;
let collection = null;

const args = process.argv.slice(2);

const yesterDay  = moment(new Date()).add(-1,'days').format('YYYY-MM-DD');
const toDay  = moment(new Date()).format('YYYY-MM-DD');

let opcoId = args[0] || "013";
let fromDate = args[1] || yesterDay;
let toDate = args[2] || toDay;
let routeStatus = args[3] || "Complete";

const collectionName = 'routeDataCollection'+opcoId;

MongoClient.connect(url, function(err, client) {
    if(err) throw err;
    db = client;
    collection = db.db(dbName).collection(collectionName);
});

const dates = [];

for (let m = moment(fromDate); m.isBefore(toDate); m.add(1, 'days')) {
    const date = m.clone();
    const startDay = date.format('YYYY-MM-DD');
    const endDay = date.add(1, 'days').format('YYYY-MM-DD');
    dates.push({
        from  : startDay,
        to : endDay
    });
}

async function pushTodatabase(value) {
    console.log('upserting documents count : ', value.length);

    for (let i in value) {
        const document = value[i];

        document.lastModifiedDate = new Date().toJSON();
        document.opcoId = opcoId;

        collection.update(
            {
                "JobKey": document.JobKey
            },
            document,
            {
                upsert: true,
                safe: false
            },
            function (err, data) {
                if (err) {
                    console.log(err);
                }
            }
        );
    }
}



Promise.each(dates, function(date) {
    console.log(date);
    return getAllJobs({
        opcoId,
        fromDate:date.from,
        toDate:date.to,
        routeStatus
    })
    .then(function(value) {
        return pushTodatabase(value);
    });
})
.then(function(data) {
  console.log('total days ; ' + data.length);
})
.finally(function(){
    db.close();
});


