require('dotenv').config();
const moment = require("moment");

const MongoClient = require('mongodb').MongoClient;
const dbName = 'RT_RouteData';
const url = process.env.URL;

const args = process.argv.slice(2);
 
const _toDay  = moment.utc(new Date());
const toDayStr  = _toDay.format('YYYY-MM-DD');

const _tommrrow = _toDay.clone();
const tommrrowStr  = _tommrrow.add(1,'days').format('YYYY-MM-DD');

let opcoId = args[0] || "013";
let fromDate = args[1] || toDayStr;
let toDate = args[2] || tommrrowStr;

const collectionName = 'RT_RouteData'+opcoId;

const from = new Date(fromDate);
const to = new Date(toDate);

MongoClient.connect(url, (err, db) => {
    if(err) throw err;
    processDataFn(db, () => {
        
        db.close();
    });
});

    
const query0 = [  
    { $match: { "Date": { $gte: from , $lt : to } } },
    {
        $match : { "RouteStatus" : { "$in" : [ "NotStarted","InProgress", "Complete" ]} }
    }
];


const query1 = [  
    { $match: { "Date": { $gte: from , $lt : to } } },
    {
        $match : { "RouteStatus" : { "$in" : [ "InProgress", "NotStarted" ]} }
    },
    {
        $sort : { RouteStatus : 1 }
    },
    {
       $group : {
          _id : "$RouteId" ,
          StatesData: { $push : { "StopsCount" : "$Count", "Name" : "$RouteStatus" }},
          StatesCount: { $sum: 1 }
       }
    },
    {
        $match : { StatesCount : {$gt : 1}}
    },
    {
        $project : {
               RouteId : "$_id",
               Inprogress : { $arrayElemAt : [ "$StatesData" , 0 ] },
               NotStarted: { $arrayElemAt : [ "$StatesData" , 1 ] }
            }
    },
    {
        $project : { IsNewStopsAdded : {$cmp : ['$Inprogress.StopsCount',  '$NotStarted.StopsCount'] },
                     StopsAdded : {$subtract : ['$Inprogress.StopsCount',  '$NotStarted.StopsCount'] }
            }
    },
    {
        $match : { IsNewStopsAdded : { "$in" : [ 1] }  }
    }
];
    
const query2 = [  
    { $match: { "Date": { $gte: from , $lt : to } } },
    {
        $match : { "RouteStatus" : { "$in" : [ "Complete" , "InProgress" ]} }
    },
    {
        $sort : { RouteStatus : 1 }
    },
    {
       $group : {
          _id : "$RouteId" ,
          StatesData: { $push : { "StopsCount" : "$Count", "Name" : "$RouteStatus" }},
          StatesCount: { $sum: 1 }
       }
    },
    {
        $match : { StatesCount : {$gt : 1}}
    },
    {
        $project : {
               RouteId : "$_id",
               Complete : { $arrayElemAt : [ "$StatesData" , 0 ] },
               Inprogress : { $arrayElemAt : [ "$StatesData" , 1 ] }
            }
    },
    {
        $project : { IsNewStopsAdded : {$cmp : ['$Complete.StopsCount',  '$Inprogress.StopsCount'] },
                     StopsAdded : {$subtract : ['$Complete.StopsCount',  '$Inprogress.StopsCount'] }
            }
    },
    {
        $match : { IsNewStopsAdded : { "$in" : [ 1] }  }
    }
];

function calcTotalAddedStops(Arr){
    let totalAddedStops = 0;
        for(let item in Arr){
            totalAddedStops += Arr[item].StopsAdded;
        }
        return totalAddedStops;
}



const processDataFn = (db, callback) => { 
    let totalRoutes = 0;

    const cursor = db.db(dbName).collection(collectionName);

    cursor.aggregate(query0).toArray(function(err, docs){
        console.log(`\nTotal routes : ${docs.length}\n`);
        totalRoutes = docs.length;
    });

    cursor.aggregate(query1).toArray(function(err, docs){
        const persentage = docs.length*100/totalRoutes || 0;
        const avgStopsPerRoute = calcTotalAddedStops(docs)/totalRoutes || 0;
        console.log(`Changed routes "NotStarted" to "Inprogress" : ${docs.length} , ${persentage.toFixed(4)} %`);
        console.log(`Average number of stops newly added per route :  ${avgStopsPerRoute.toFixed(4)}\n`);     
    });

    cursor.aggregate(query2).toArray(function(err, docs){
        const persentage = docs.length*100/totalRoutes || 0;
        const avgStopsPerRoute = calcTotalAddedStops(docs)/totalRoutes || 0;
        console.log(`Changed routes "Inprogress" to "Complete" : ${docs.length} , ${persentage.toFixed(4)} %`);
        console.log(`Average number of stops newly added per route :  ${avgStopsPerRoute.toFixed(4)}\n`);
    });

        
    callback();
};




