'use strict';
import { getAllJobs } from './store';
import moment from 'moment';
import Promise from 'bluebird';

const MongoClient = require('mongodb').MongoClient;
const dbName = 'DataStatus';
const url = process.env.URL;

let db = null;
let collection = null;

// const args = process.argv.slice(2);

// const yesterDay  = moment(new Date()).add(-1,'days').format('YYYY-MM-DD');
// const toDay  = moment(new Date()).format('YYYY-MM-DD');

// let opcoId = args[0] || "013";
// let fromDate = args[1] || yesterDay;
// let toDate = args[2] || toDay;
// let routeStatus = args[3] || "Complete";

const collectionName = 'Data__'+"045";

MongoClient.connect(url, function(err, client) {
    if(err) throw err;
    db = client;
    collection = db.db(dbName).collection(collectionName);
});

// const dates = [];

// for (let m = moment(fromDate); m.isBefore(toDate); m.add(1, 'days')) {
//     const date = m.clone();
//     const startDay = date.format('YYYY-MM-DD');
//     const endDay = date.add(1, 'days').format('YYYY-MM-DD');
//     dates.push({
//         from  : startDay,
//         to : endDay
//     });
// }

// async function pushTodatabase(value) {
//     console.log('upserting documents count : ', value.length);

//     for (let i in value) {
//         const document = value[i];

//         document.lastModifiedDate = new Date().toJSON();
//         document.opcoId = opcoId;

//         collection.update(
//             {
//                 "JobKey": document.JobKey
//             },
//             document,
//             {
//                 upsert: true,
//                 safe: false
//             },
//             function (err, data) {
//                 if (err) {
//                     console.log(err);
//                 }
//             }
//         );
//     }
// }

//const yesterDay  = moment(new Date()).add(-1,'days').format('YYYY-MM-DD');
const toDay  = moment(new Date()).format('YYYY-MM-DD');
const tommrrow  = moment(new Date()).add(1,'days').format('YYYY-MM-DD');

console.log(new Date(toDay));

var fnc = [getAllJobs({
    opcoId : "045",
    fromDate:toDay,
    toDate:tommrrow,
    routeStatus: "NotStarted"
    }),
    getAllJobs({
        opcoId : "045",
        fromDate:toDay,
        toDate:tommrrow,
        routeStatus:"InProgress"
    }),
    getAllJobs({
        opcoId : "045",
        fromDate:toDay,
        toDate:tommrrow,
        routeStatus: "Complete"
    })
];

var Data = [];

var dataFn = function(resultSet, DataArr, routeState){
    var data = {};
    data["routeStatus"] = routeState;
    data["total_stops"] = resultSet.length;
    var tototal_Routes = 0;
    for (let i in resultSet){
        if(data.hasOwnProperty(resultSet[i].RouteNo)){
            data[resultSet[i].RouteNo]++;
        }else{
            data[resultSet[i].RouteNo] = 1;
            tototal_Routes++;
        }
    }
    data["tototal_Routes"] = tototal_Routes;
    DataArr.push(data);
}

Promise.all(fnc)
  .then(results => {
    // var data = {};
    // console.log(results[2].length);
    // data["routeStatus"] = "Complete";
    // for (let i in results[2]){
    //     //console.log(results[2][i].RouteNo);
    //     if(data.hasOwnProperty(results[2][i].RouteNo)){
    //         data[results[2][i].RouteNo]++;
    //     }else{
    //         data[results[2][i].RouteNo] = 1;
    //     }    
    // }
    // Data.push(data);

    for(let j in results){
        let resultSet = results[j];

            console.log(resultSet.length);

            for(let i in resultSet){
            // var data = {};
            // data["Date"] = new Date();
            // data["RouteId"] = results[0][i].RouteId;
            // data["RouteNo"] = results[0][i].RouteNo;

            let item = resultSet[i];

            //console.log();
        
            collection.update({
                "RouteId": item.RouteId , 
                "RouteStatus" : item.RouteStatus 
            }, {
                $set : { Date : new Date(toDay),
                         RouteId : item.RouteId,
                         RouteNo : item.RouteNo,
                         RouteStatus : item.RouteStatus,
                         $inc: { total_stops:  1 }
                       }
                
            }, {
                upsert: true,
                //multi: true
            })

        }

    }
    // dataFn(results[0], Data, "NotStarted");
    // dataFn(results[1], Data, "InProgress");
    // dataFn(results[2], Data, "Complete");

    // return(Data);

  }).finally(function(){
    db.close();
});
  

// Promise.each(dates, function(date) {
//     console.log(date);
//     return getAllJobs({
//         opcoId,
//         fromDate:date.from,
//         toDate:date.to,
//         routeStatus
//     })
//     .then(function(value) {
//         return pushTodatabase(value);
//     });
// })
// .then(function(data) {
//   console.log('total days ; ' + data.length);
// })
// .finally(function(){
//     //db.close();
// });




// $set : { Date : new Date(toDay)},
// $set : { RouteId : item.RouteId},
// $set : { RouteNo : item.RouteNo},
// $set : { RouteStatus : item.RouteStatus},
// $inc: { total_stops:  1 }