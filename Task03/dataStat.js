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

let opcoId = args[0] || "045";
let fromDate = args[1] || yesterDay;
let toDate = args[2] || toDay;
let routeStatus = args[3] || "Complete";

const collectionName = 'routeDataCollection_'+opcoId;

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
    const query1 = { $where: `this.ExpectedArrivalTime > '${from}' && this.ExpectedArrivalTime < '${to}'` };
    cursor.find(query1).count().then((n) => {
        console.log(`There are total ${n} documents from ${from} to ${to}`);  
        totalDocuments = n;
    
    });

    //STS_StartUnloadTime >= ActualArrivalTime AND STS_StartUnloadTime <= ActualDepartureTime
    var query2 = { $where: `this.ExpectedArrivalTime > '${from}' && this.ExpectedArrivalTime < '${to}'&&
                            this.STS_StartUnloadTime != '' && this.STS_EndUnloadTime != '' && 
                            this.ActualArrivalTime != '' && this.ActualDepartureTime != '' && 
                            ISODate(this.STS_StartUnloadTime) >= ISODate(this.ActualArrivalTime) && 
                            ISODate(this.STS_StartUnloadTime) <= ISODate(this.ActualDepartureTime) `};
    cursor.find(query2).count().then((n) => {
        let persentage = (n*100)/totalDocuments;
        console.log(`STS_StartUnloadTime >= ActualArrivalTime AND STS_StartUnloadTime <= ActualDepartureTime : ${n} , ${persentage.toFixed(2)} % `);   
    });

    //STS_StartUnloadTime < ActualArrivalTime
    var query3 = { $where: `this.ExpectedArrivalTime > '${from}' && this.ExpectedArrivalTime < '${to}' &&
                            this.STS_StartUnloadTime != '' && this.STS_EndUnloadTime != '' && 
                            this.ActualArrivalTime != '' && this.ActualDepartureTime != '' && 
                            ISODate(this.STS_StartUnloadTime) < ISODate(this.ActualArrivalTime) `};
    cursor.find(query3).count().then((n) => {
        let persentage = (n*100)/totalDocuments;
        console.log(`STS_StartUnloadTime < ActualArrivalTime : ${n} , ${persentage.toFixed(2)} % `);   
    });

    //STS_StartUnloadTime > ActualDepartureTime
    var query4 = { $where: `this.ExpectedArrivalTime > '${from}' && this.ExpectedArrivalTime < '${to}' &&
                            this.STS_StartUnloadTime != '' && this.STS_EndUnloadTime != '' && 
                            this.ActualArrivalTime != '' && this.ActualDepartureTime != '' && 
                            ISODate(this.STS_StartUnloadTime) > ISODate(this.ActualDepartureTime) `};
    cursor.find(query4).count().then((n) => {
        let persentage = (n*100)/totalDocuments;
        console.log(`STS_StartUnloadTime > ActualDepartureTime : ${n} , ${persentage.toFixed(2)} % `);  
    });

    //STS_EndUnloadTime <= ActualDepartureTime AND STS_EndUnloadTime >= ActualArrivalTime
    var query5 = { $where: `this.ExpectedArrivalTime > '${from}' && this.ExpectedArrivalTime < '${to}' &&
                            this.STS_StartUnloadTime != '' && this.STS_EndUnloadTime != '' && 
                            this.ActualArrivalTime != '' && this.ActualDepartureTime != '' && 
                            ISODate(this.STS_EndUnloadTime) <= ISODate(this.ActualDepartureTime) && 
                            ISODate(this.STS_EndUnloadTime) >= ISODate(this.ActualArrivalTime) `};
    cursor.find(query5).count().then((n) => {
        let persentage = (n*100)/totalDocuments;
        console.log(`STS_EndUnloadTime <= ActualDepartureTime AND STS_EndUnloadTime >= ActualArrivalTime : ${n} , ${persentage.toFixed(2)} % `);   
    });

    //STS_EndUnloadTime < ActualArrivalTime
    var query6 = { $where: `this.ExpectedArrivalTime > '${from}' && this.ExpectedArrivalTime < '${to}' &&
                            this.STS_StartUnloadTime != '' && this.STS_EndUnloadTime != '' && 
                            this.ActualArrivalTime != '' && this.ActualDepartureTime != '' && 
                            ISODate(this.STS_EndUnloadTime) < ISODate(this.ActualArrivalTime) `};
    cursor.find(query6).count().then((n) => {
        let persentage = (n*100)/totalDocuments;
        console.log(`STS_EndUnloadTime < ActualArrivalTime : ${n} , ${persentage.toFixed(2)} %`);  
    });

    //STS_EndUnloadTime > ActualDepartureTime
    var query7 = { $where: `this.ExpectedArrivalTime > '${from}' && this.ExpectedArrivalTime < '${to}' &&
                            this.STS_StartUnloadTime != '' && this.STS_EndUnloadTime != '' && 
                            this.ActualArrivalTime != '' && this.ActualDepartureTime != '' && 
                            ISODate(this.STS_EndUnloadTime) > ISODate(this.ActualDepartureTime) `};
    cursor.find(query7).count().then((n) => {
        let persentage = (n*100)/totalDocuments;
        console.log(`STS_EndUnloadTime > ActualDepartureTime : ${n} , ${persentage.toFixed(2)} %`);   
    });

    //STS_StartUnloadTime is empty AND STS_EndUnloadTime is not empty.
    var query8 = { $where: `this.ExpectedArrivalTime > '${from}' && this.ExpectedArrivalTime < '${to}' &&
                            this.STS_StartUnloadTime == '' && this.STS_EndUnloadTime != '' `};
    cursor.find(query8).count().then((n) => {
        let persentage = (n*100)/totalDocuments;
        console.log(`STS_StartUnloadTime is empty AND STS_EndUnloadTime is not empty : ${n} , ${persentage.toFixed(2)} %`); 
    });

    //STS_StartUnloadTime is not empty AND STS_EndUnloadTime is empty.
    var query9 = { $where: `this.ExpectedArrivalTime > '${from}' && this.ExpectedArrivalTime < '${to}' &&
                            this.STS_StartUnloadTime != '' && this.STS_EndUnloadTime == '' `};
    cursor.find(query9).count().then((n) => {
        let persentage = (n*100)/totalDocuments;
        console.log(`STS_StartUnloadTime is not empty AND STS_EndUnloadTime is empty : ${n} , ${persentage.toFixed(2)} %`); 
    });

    //STS_StartUnloadTime is empty AND STS_EndUnloadTime is empty.
    var query10 = { $where: `this.ExpectedArrivalTime > '${from}' && this.ExpectedArrivalTime < '${to}' &&
                            this.STS_StartUnloadTime == '' && this.STS_EndUnloadTime == '' `};
    cursor.find(query10).count().then((n) => {
        let persentage = (n*100)/totalDocuments;
        console.log(`STS_StartUnloadTime is empty AND STS_EndUnloadTime is empty : ${n} , ${persentage.toFixed(2)} %`);  
    });


    //STS_StartUnloadTime & STS_EndUnloadTime are not empty AND ActualArrivalTime & ActualDepartureTime are empty. 
    var query11 = { $where: `this.ExpectedArrivalTime > '${from}' && this.ExpectedArrivalTime < '${to}' &&
                            this.STS_StartUnloadTime != '' && this.STS_EndUnloadTime != '' && 
                            this.ActualArrivalTime == '' && this.ActualDepartureTime == '' `};
    cursor.find(query11).count().then((n) => {
        let persentage = (n*100)/totalDocuments;
        console.log(`STS_StartUnloadTime & STS_EndUnloadTime are not empty AND ActualArrivalTime & ActualDepartureTime are empty : ${n} , ${persentage.toFixed(2)} %`);   
    });
    callback();

   
};




