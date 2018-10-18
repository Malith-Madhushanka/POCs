'use strict';
import { getAllJobs } from './store';
import moment from 'moment';
import Promise from 'bluebird';

const MongoClient = require('mongodb').MongoClient;
const dbName = 'DataStatus';
const url = process.env.URL;
 
let db = null;
let collection = null;

const args = process.argv.slice(2);

const _toDay  = moment.utc(new Date());

const toDayClone = _toDay.clone();
const _tommorrow  = toDayClone.add(1,'days');

let opcoId = args[0] || "013";
let fromDate = args[1] || _toDay.format('YYYY-MM-DD');
let toDate = args[2] || _tommorrow.format('YYYY-MM-DD');

const collectionName = 'DataSet02'+opcoId;

var fnc = [getAllJobs({
    opcoId,
    fromDate,
    toDate,
    routeStatus: "NotStarted"
    }),
    getAllJobs({
        opcoId,
        fromDate,
        toDate,
        routeStatus:"InProgress"
    }),
    getAllJobs({
        opcoId,
        fromDate,
        toDate,
        routeStatus: "Complete"
    })
];

var TransformedData = [];

function TransformData(_data, _state){
    console.log(_state + " stops :"+_data.length);
    for(let index0 in _data){
        let rowItem = _data[index0];

        let formattedItem = TransformedData.find(i => (i.RouteId == rowItem.RouteId) && (i.RouteStatus == rowItem.RouteStatus));

        if(formattedItem){
            formattedItem.Count++;
            formattedItem.CustID.push(rowItem.CustID);
        }
        else{
            formattedItem = {}
            formattedItem["RouteId"] = rowItem.RouteId;
            formattedItem["RouteStatus"] = _state;
            formattedItem["Date"] = new Date(fromDate);
            formattedItem["Count"] = 1;
            formattedItem["CustID"] = [rowItem.CustID];
            formattedItem["TimeStamp"] = new Date();

            TransformedData.push(formattedItem);
        }
    }
}

MongoClient.connect(url, function(err, client) {
    if(err) {throw err};
    collection = client.db(dbName).collection(collectionName);

    Promise.all(fnc)
    .then(results => {
        TransformData(results[0], "NotStarted");
        TransformData(results[1], "InProgress");
        TransformData(results[2], "Complete");

        for(var index0 in TransformedData){
            let item = TransformedData[index0];

            //console.log(item);

            collection.update({
                "RouteId": item.RouteId , 
                "RouteStatus" : item.RouteStatus,
                "Date": item.Date,
                "CustID": item.CustID,
                "Count": item.Count
            }, item , {
                upsert: true
            });
        }
    }).finally(() => {
        client.close();
    });
});
