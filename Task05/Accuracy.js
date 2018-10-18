require('dotenv').config();
const moment = require("moment");

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



MongoClient.connect(url, (err, db) => {
    if(err) throw err;
    processDataFn(db, () => {
        
        db.close();
    });
});
    
const processDataFn = (db, callback) => { 


    let totalDocuments = 0;
    const cursor = db.db(dbName).collection(collectionName);
    //find count of all entries between given dates
    //const query0 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}')` };
    // const query = {"JobKey": /.*0132018-02-19.*/};
    // cursor.find(query).count().then((n) => {
    //     console.log(`\nThere are total ${n} documents from`);  
    //     totalDocuments = n;
    
    // });

    cursor.find(query).count().toArray((n) => {
        console.log(n);  
        totalDocuments = n;
    
    });
    
    callback();
};




