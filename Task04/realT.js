require('dotenv').config();
const moment = require("moment");

const MongoClient = require('mongodb').MongoClient;
const dbName = 'DataStatus';
const url = process.env.URL;

let db = null;
let collection = null;

const args = process.argv.slice(2);
 
const _toDay  = moment.utc(new Date());
const toDayStr  = _toDay.format('YYYY-MM-DD');
//console.log(toDayStr);

const _tommrrow = _toDay.clone();
const tommrrowStr  = _tommrrow.add(1,'days').format('YYYY-MM-DD');
//console.log(tommrrowStr);

let opcoId = args[0] || "013";
let fromDate = args[1] || toDayStr;
let toDate = args[2] || tommrrowStr;

const collectionName = 'DataSet02'+opcoId;

//var to = new Date("2018-03-07");
var to = new Date(fromDate);
var from = new Date(toDate);
//console.log(" value  :",to);
console.log(`from ${to} to ${from}`);


MongoClient.connect(url, (err, db) => {
    if(err) throw err;
    processDataFn(db, () => {
        
        db.close();
    });
});

//All routes from given date range:    
const query0 = [  
    { $match: { "Date": { $gte: to , $lt : from } } },
    {
        $match : { "RouteStatus" : { "$in" : [ "NotStarted","InProgress", "Complete" ]} }
    }
];

//Number of Modified Routes(new stops added when state transtion from Not started to Inprogress)
const query1 = [  
    { $match: { "Date": { $gte: to , $lt : from } } },
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

//Number of Modified Routes(new stops added when state transtion from InProgress to Complete)
const query2 = [  
    { $match: { "Date": { $gte: to , $lt : from } } },
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

// Total modifeid routes in the "NotStarted state" 
const query3 = [  
    { $match: { "Date": { $gte: to , $lt : from } } },
        {
            $match : { "RouteStatus" : { "$in" : [ "NotStarted"]} }
        },
        {
            $sort : { RouteStatus : 1 }
        },
        {
           $group : {
              _id : "$RouteId" ,
              StatesData: { $push : { "StopsCount" : "$Count", "Name" : "$RouteStatus" }},
              CustId: { $push : { "CustList" : "$CustID"}},
              StatesCount: { $sum: 1 }
           }
        },
        {
            $match : { StatesCount : {$gt : 1}}
        }    
];


// Total stop count not changed but customer list changed in "NotStarted" state 
const query3_1 = [  
        { $match: { "Date": { $gte: to , $lt : from } } },
            {
                $match : { "RouteStatus" : { "$in" : [ "NotStarted"]} }
            },
            {
                $sort : { RouteStatus : 1 }
            },
            {
               $group : {
                  _id : "$RouteId" ,
                  StatesData: { $push : { "StopsCount" : "$Count", "Name" : "$RouteStatus" }},
                  CustId: { $push : { "CustList" : "$CustID"}},
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
                       NotStarted: { $arrayElemAt : [ "$StatesData" , 1 ] },
        
                       CustOne : { $arrayElemAt : [ "$CustId" , 0 ] },
                       CustTwo: { $arrayElemAt : [ "$CustId" , 1 ] }
                    }
            },
            {
                $project : { IsNewStopsAdded : {$cmp : ['$Inprogress.StopsCount',  '$NotStarted.StopsCount'] },
                             StopsAdded : {$subtract : ['$Inprogress.StopsCount',  '$NotStarted.StopsCount'] },
                             Diff : { $setDifference : [ "$CustOne.CustList", "$CustTwo.CustList" ]},
                             
                    },
                   
            },
            {
                //$match : { Diff : {$ne : []}}
                $match : { $and : [ {Diff : {$ne : []}}, {StopsAdded : {$eq : 0} }]}
            }
        
];

const query4_1 = [  
    { $match: { "Date": { $gte: to , $lt : from } } },
    {
        $match : { "RouteStatus" : { "$in" : [ "NotStarted" ]} }
    },
    {
        $sort : { RouteStatus : 1 }
    },
    {
       $group : {
          _id : "$RouteId" ,
          StatesData: { $push : { "StopsCount" : "$Count", "Name" : "$RouteStatus" }},
          CustId: { $push : { "CustList" : "$CustID"}},
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
               NotStarted: { $arrayElemAt : [ "$StatesData" , 1 ] },

               CustOne : { $arrayElemAt : [ "$CustId" , 0 ] },
               CustTwo: { $arrayElemAt : [ "$CustId" , 1 ] }
            }
    },
    {
        $project : { IsNewStopsAdded : {$cmp : ['$Inprogress.StopsCount',  '$NotStarted.StopsCount'] },
                     StopsAdded : {$subtract : ['$Inprogress.StopsCount',  '$NotStarted.StopsCount'] },
                     Diff : { $setDifference : [ "$CustOne.CustList", "$CustTwo.CustList" ]},
                     NofoArrItems : { $size : "$Diff"}
            }
    },
    {
        $match : { IsNewStopsAdded : { "$in" : [ 1] }  }
    }
];

function calcTotalStops(Arr){
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
        console.log(new Date(docs[0].TimeStamp).getTime());
    });

    cursor.aggregate(query1).toArray(function(err, docs){
        let persentage = docs.length*100/totalRoutes || 0;
        let avgStopsPerRoute = calcTotalStops(docs)/totalRoutes || 0;
        console.log(`Changed routes "NotStarted" to "Inprogress" : ${docs.length} , ${persentage.toFixed(4)} %`);
        console.log(`Average number of stops newly added per route :  ${avgStopsPerRoute.toFixed(4)}\n`);
        console.log(docs);

        
    });

    cursor.aggregate(query2).toArray(function(err, docs){
        let persentage = docs.length*100/totalRoutes || 0;
        let avgStopsPerRoute = calcTotalStops(docs)/totalRoutes || 0;
        console.log(`Changed routes "Inprogress" to "Complete" : ${docs.length} , ${persentage.toFixed(4)} %`);
        console.log(`Average number of stops newly added per route :  ${avgStopsPerRoute.toFixed(4)}\n`);
        //console.log(docs);
    });

    cursor.aggregate(query3).toArray(function(err, docs){
        // let persentage = docs.length*100/totalRoutes || 0;
        // let avgStopsPerRoute = calcTotalStops(docs)/totalRoutes || 0;
        // console.log(`Changed routes "Inprogress" to "Complete" : ${docs.length} , ${persentage.toFixed(4)} %`);
        // console.log(`Average number of stops newly added per route :  ${avgStopsPerRoute.toFixed(4)}\n`);
        console.log("%j",docs.length);
        


    });

        
    callback();
};




