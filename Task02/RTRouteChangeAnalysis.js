require('dotenv').config();
const moment = require("moment");
var _ = require('lodash');


const MongoClient = require('mongodb').MongoClient;
const dbName = 'RT_RouteData';
const url = process.env.URL;

let db = null;
let collection = null;

const args = process.argv.slice(2);

const _toDay = moment.utc(new Date());
const toDayStr = _toDay.format('YYYY-MM-DD');

const _tommrrow = _toDay.clone();
const tommrrowStr = _tommrrow.add(1, 'days').format('YYYY-MM-DD');

let opcoId = args[0] || "013";
let fromDate = args[1] || toDayStr;
let toDate = args[2] || tommrrowStr;

const collectionName = 'RT_RouteDataTemp' + opcoId;

var from = new Date(fromDate);
var to = new Date(toDate);

MongoClient.connect(url, (err, db) => {
    if (err) throw err;
    processDataFn(db, () => {

        db.close();
    });
});

//All routes from given date range:    
const query0 = [
    { $match: { "Date": { $gte: from, $lt: to } } },
    {
        $match: { "RouteStatus": { "$in": ["NotStarted", "InProgress", "Complete"] } }
    },
    {
        $group: {
            _id: "$RouteId"
        }
    }
];



// Total modifeid routes in the "NotStarted state to "InProgress state" 
const query1 = [
    { $match: { "Date": { $gte: from, $lt: to } } },
    {
        $match: { "RouteStatus": { "$in": ["NotStarted", "InProgress"] } }
    },
    {
        $sort: { RouteStatus: 1 }
    },
    {
        $group: {
            _id: "$RouteId",
            Data: { $push: "$$ROOT" },
            StatesCount: { $sum: 1 }
        }
    },
    {
        $match: { StatesCount: { $gt: 1 } }
    }
];

// Total modifeid routes in the "InProgress state to "Complete" state 
const query2 = [
    { $match: { "Date": { $gte: from, $lt: to } } },
    {
        $match: { "RouteStatus": { "$in": ["Complete", "InProgress"] } }
    },
    {
        $sort: { RouteStatus: 1 }
    },
    {
        $group: {
            _id: "$RouteId",
            Data: { $push: "$$ROOT" },
            StatesCount: { $sum: 1 }
        }
    },
    {
        $match: { StatesCount: { $gt: 1 } }
    }
];

// #of modified routes within "Notstarted" state 
const query3 = [
    { $match: { "Date": { $gte: from, $lt: to } } },
    {
        $match: { "RouteStatus": { "$in": ["NotStarted"] } }
    },
    {
        $sort: { RouteStatus: 1 }
    },
    {
        $group: {
            _id: "$RouteId",
            StatesCount: { $sum: 1 }
        }
    },
    {
        $match: { StatesCount: { $gt: 1 } }
    }
];

// #of modified routes within "InProgress" state 
const query4 = [
    { $match: { "Date": { $gte: from, $lt: to } } },
    {
        $match: { "RouteStatus": { "$in": ["InProgress"] } }
    },
    {
        $sort: { RouteStatus: 1 }
    },
    {
        $group: {
            _id: "$RouteId",
            StatesCount: { $sum: 1 }
        }
    },
    {
        $match: { StatesCount: { $gt: 1 } }
    }
];

// #of modified routes within "Complete" state 
const query5 = [
    { $match: { "Date": { $gte: from, $lt: to } } },
    {
        $match: { "RouteStatus": { "$in": ["Complete"] } }
    },
    {
        $sort: { RouteStatus: 1 }
    },
    {
        $group: {
            _id: "$RouteId",
            StatesCount: { $sum: 1 }
        }
    },
    {
        $match: { StatesCount: { $gt: 1 } }
    }
];



const processDataFn = (db, callback) => {
    let totalRoutes = 0;

    const cursor = db.db(dbName).collection(collectionName);

    cursor.aggregate(query0).toArray(function (err, docs) {
        console.log(`\nTotal routes : ${docs.length}\n`);
        totalRoutes = docs.length;
    });

    cursor.aggregate(query1).toArray(function (err, docs) {
        const ModifiedCustListCount = dataPocessFn(docs, "NotStarted", "InProgress");
        const persentage = ModifiedCustListCount * 100 / totalRoutes || 0;
        console.log(`Number of modified routes "NotStarted" to "InProgress" : ${ModifiedCustListCount} , ${persentage.toFixed(4)} %`);

    });

    cursor.aggregate(query2).toArray(function (err, docs) {
        const ModifiedCustListCount = dataPocessFn(docs, "Complete", "InProgress");
        const persentage = ModifiedCustListCount * 100 / totalRoutes || 0;
        console.log(`Number of modified routes "Inprogress" to "Complete" : ${ModifiedCustListCount} , ${persentage.toFixed(4)} %`);
        
    });

    cursor.aggregate(query3).toArray(function (err, docs) {
        const persentage = docs.length*100/totalRoutes || 0;
        console.log(`\nChanged routes within "NotStarted" state : ${docs.length} , ${persentage.toFixed(4)} %`);
    });

    cursor.aggregate(query4).toArray(function (err, docs) {
        const persentage = docs.length*100/totalRoutes || 0;
        console.log(`\nChanged routes within "InProgress" state : ${docs.length} , ${persentage.toFixed(4)} %`);
    });

    cursor.aggregate(query5).toArray(function (err, docs) {
        const persentage = docs.length*100/totalRoutes || 0;
        console.log(`\nChanged routes within "Complete" state : ${docs.length} , ${persentage.toFixed(4)} %`);
    });

    callback();
};


function dataPocessFn(docs, State1, State2) {

    let ModifiedCustListCount = 0;

    for (let item in docs) {
        const _data = docs[item].Data;
        let date = new Date('1970-01-01').getTime();
        let date1 = new Date('2100-01-01').getTime();

        let CustArr1 = [];
        let CustArr2 = [];

        let RouteStatus1 = 0;
        let RouteStatus2 = 0;

        for (k in _data) {
            const _item = _data[k];
            //console.log(_item);
            tmpDate = new Date(_item.TimeStamp).getTime();
            if (_item.RouteStatus === State1 && date <= tmpDate) {
                date = tmpDate;
                CustArr1 = _item.CustID;
                RouteStatus1++;
            }
            // if (_item.RouteStatus === State2 && date <= tmpDate) {
            //     date = tmpDate;
            //     CustArr2 = _item.CustID;
            //     RouteStatus2++;
            // }

            if (_item.RouteStatus === State2 && date1 >= tmpDate) {
                date1 = tmpDate;
                CustArr2 = _item.CustID;
                RouteStatus2++;
            }
        }
        const bool = _.isEqual(CustArr1.sort(), CustArr2.sort());

        // if (!bool && RouteStatus1 === RouteStatus2) {
        //     ModifiedCustListCount++;
        // }
        if (!bool && RouteStatus1 != 0 && RouteStatus2 != 0) {
            ModifiedCustListCount++;
        }
    }

    return ModifiedCustListCount;

}




