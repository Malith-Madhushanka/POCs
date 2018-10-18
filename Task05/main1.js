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

const from = moment(fromDate).utcOffset(0, true).format('YYYY-MM-DD HH:mm:ss');
const to = moment(toDate).utcOffset(0, true).format('YYYY-MM-DD HH:mm:ss');











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
    const query0 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}')` };
    cursor.find(query0).count().then((n) => {
        console.log(`\nThere are total ${n} documents from, (including) ${from} to ${to}\n`);  
        totalDocuments = n;
    
    });

    //STS_StartUnloadTime >= ActualArrivalTime AND STS_StartUnloadTime <= ActualDepartureTime
    //Start unloading within the geofence
    var query1 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}')&&
                            this.STS_StartUnloadTime != '' && this.STS_EndUnloadTime != '' && 
                            this.ActualArrivalTime != '' && this.ActualDepartureTime != '' && 
                            ISODate(this.STS_StartUnloadTime) >= ISODate(this.ActualArrivalTime) && 
                            ISODate(this.STS_StartUnloadTime) <= ISODate(this.ActualDepartureTime) `};
    cursor.find(query1).count().then((n) => {
        let persentage = (n*100)/totalDocuments;
        console.log(`Start unloading within the geofence : ${n} , ${persentage.toFixed(2)} % `);   
    });

    
    callback();
};




