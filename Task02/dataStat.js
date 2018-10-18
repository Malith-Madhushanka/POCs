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

    //STS_EndUnloadTime <= ActualDepartureTime AND STS_EndUnloadTime >= ActualArrivalTime
    //End unloading within the geofence
    var query2 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                            this.STS_StartUnloadTime != '' && this.STS_EndUnloadTime != '' && 
                            this.ActualArrivalTime != '' && this.ActualDepartureTime != '' && 
                            ISODate(this.STS_EndUnloadTime) <= ISODate(this.ActualDepartureTime) && 
                            ISODate(this.STS_EndUnloadTime) >= ISODate(this.ActualArrivalTime) `};
    cursor.find(query2).count().then((n) => {
        let persentage = (n*100)/totalDocuments;
        console.log(`End unloading within the geofence : ${n} , ${persentage.toFixed(2)} % \n`); 
    });

    //STS_StartUnloadTime < ActualArrivalTime
    //Start unloading before entering the Geofence
    var query3 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                            this.STS_StartUnloadTime != '' && this.STS_EndUnloadTime != '' && 
                            this.ActualArrivalTime != '' && this.ActualDepartureTime != '' && 
                            ISODate(this.STS_StartUnloadTime) < ISODate(this.ActualArrivalTime) `};
    cursor.find(query3).count().then((n) => {
        let persentage = (n*100)/totalDocuments;
        console.log(`Start unloading before entering the geofence : ${n} , ${persentage.toFixed(2)} % `);   
    });

                //Start unloading before entering the Geofence 
                //d = difference in minutes between STS timestamp and Telogis timestamp
                //d < -40
                var query3_1 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                                        this.STS_StartUnloadTime != '' && this.STS_EndUnloadTime != '' && 
                                        this.ActualArrivalTime != '' && this.ActualDepartureTime != '' && 
                                        ISODate(this.STS_StartUnloadTime) < ISODate(this.ActualArrivalTime) &&
                                        (ISODate(this.STS_StartUnloadTime)-ISODate(this.ActualArrivalTime)) < -2400000
                                        `};
                cursor.find(query3_1).count().then((n) => {
                    let persentage = (n*100)/totalDocuments;
                    console.log(`[ d = difference in minutes between STS timestamp and Telogis timestamp ]\n`);
                    console.log(`       (d < -40 min): ${n} , ${persentage.toFixed(2)} % `);   
                });

                //Start unloading before entering the Geofence 
                //d = difference in minutes between STS timestamp and Telogis timestamp
                //d < -20 && d >= -40
                var query3_2 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                                        this.STS_StartUnloadTime != '' && this.STS_EndUnloadTime != '' && 
                                        this.ActualArrivalTime != '' && this.ActualDepartureTime != '' && 
                                        ISODate(this.STS_StartUnloadTime) < ISODate(this.ActualArrivalTime) &&
                                        (ISODate(this.STS_StartUnloadTime)-ISODate(this.ActualArrivalTime)) >= -2400000 &&
                                        (ISODate(this.STS_StartUnloadTime)-ISODate(this.ActualArrivalTime)) < -1200000
                                        `};
                cursor.find(query3_2).count().then((n) => {
                    let persentage = (n*100)/totalDocuments;
                    console.log(`       (d < -20 min && d >= -40 min): ${n} , ${persentage.toFixed(2)} % `);   
                });

                //Start unloading before entering the Geofence 
                //d = difference in minutes between STS timestamp and Telogis timestamp
                //d < -10 && d >= -20
                var query3_3 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                                        this.STS_StartUnloadTime != '' && this.STS_EndUnloadTime != '' && 
                                        this.ActualArrivalTime != '' && this.ActualDepartureTime != '' && 
                                        ISODate(this.STS_StartUnloadTime) < ISODate(this.ActualArrivalTime) &&
                                        (ISODate(this.STS_StartUnloadTime)-ISODate(this.ActualArrivalTime)) >= -1200000 &&
                                        (ISODate(this.STS_StartUnloadTime)-ISODate(this.ActualArrivalTime)) < -600000
                                        `};
                cursor.find(query3_3).count().then((n) => {
                    let persentage = (n*100)/totalDocuments;
                    console.log(`       (d < -10 min && d >= -20 min): ${n} , ${persentage.toFixed(2)} % `);   
                });

                //Start unloading before entering the Geofence 
                //d = difference in minutes between STS timestamp and Telogis timestamp
                //d < 0 && d >= -10
                var query3_4 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                                        this.STS_StartUnloadTime != '' && this.STS_EndUnloadTime != '' && 
                                        this.ActualArrivalTime != '' && this.ActualDepartureTime != '' && 
                                        ISODate(this.STS_StartUnloadTime) < ISODate(this.ActualArrivalTime) &&
                                        (ISODate(this.STS_StartUnloadTime)-ISODate(this.ActualArrivalTime)) >= -600000 &&
                                        (ISODate(this.STS_StartUnloadTime)-ISODate(this.ActualArrivalTime)) < 0
                                        `};
                cursor.find(query3_4).count().then((n) => {
                    let persentage = (n*100)/totalDocuments;
                    console.log(`       (d < 0 min && d >= -10 min): ${n} , ${persentage.toFixed(2)} % \n`);   
                });

    



    //STS_StartUnloadTime > ActualDepartureTime
    //Start unloading after leaving the Geofence
    var query4 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                            this.STS_StartUnloadTime != '' && this.STS_EndUnloadTime != '' && 
                            this.ActualArrivalTime != '' && this.ActualDepartureTime != '' && 
                            ISODate(this.STS_StartUnloadTime) > ISODate(this.ActualDepartureTime) `};
    cursor.find(query4).count().then((n) => {
        let persentage = (n*100)/totalDocuments;
        console.log(`Start unloading after leaving the geofence : ${n} , ${persentage.toFixed(2)} % `);  
    });

                //STS_StartUnloadTime > ActualDepartureTime
                //Start unloading after leaving the Geofence
                //d >= 0 && d < 10
                var query4_1 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                                        this.STS_StartUnloadTime != '' && this.STS_EndUnloadTime != '' && 
                                        this.ActualArrivalTime != '' && this.ActualDepartureTime != '' && 
                                        ISODate(this.STS_StartUnloadTime) > ISODate(this.ActualDepartureTime) &&
                                        (ISODate(this.STS_StartUnloadTime)-ISODate(this.ActualDepartureTime)) >= 0 &&
                                        (ISODate(this.STS_StartUnloadTime)-ISODate(this.ActualDepartureTime)) < 600000
                                        `};
                cursor.find(query4_1).count().then((n) => {
                    let persentage = (n*100)/totalDocuments;

                    console.log(`       (d >= 0 min && d < 10 min) : ${n} , ${persentage.toFixed(2)} %`);  
                });

                //STS_StartUnloadTime > ActualDepartureTime
                //Start unloading after leaving the Geofence
                //d >= 10 && d < 20 
                var query4_2 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                                        this.STS_StartUnloadTime != '' && this.STS_EndUnloadTime != '' && 
                                        this.ActualArrivalTime != '' && this.ActualDepartureTime != '' && 
                                        ISODate(this.STS_StartUnloadTime) > ISODate(this.ActualDepartureTime) &&
                                        (ISODate(this.STS_StartUnloadTime)-ISODate(this.ActualDepartureTime)) >= 600000 &&
                                        (ISODate(this.STS_StartUnloadTime)-ISODate(this.ActualDepartureTime)) < 1200000
                                        `};
                cursor.find(query4_2).count().then((n) => {
                    let persentage = (n*100)/totalDocuments;
                    console.log(`       (d >= 10 min && d < 20 min) : ${n} , ${persentage.toFixed(2)} %`);  
                });

                //STS_StartUnloadTime > ActualDepartureTime
                //Start unloading after leaving the Geofence
                //d >= 20 && d < 40 
                var query4_3 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                                        this.STS_StartUnloadTime != '' && this.STS_EndUnloadTime != '' && 
                                        this.ActualArrivalTime != '' && this.ActualDepartureTime != '' && 
                                        ISODate(this.STS_StartUnloadTime) > ISODate(this.ActualDepartureTime) &&
                                        (ISODate(this.STS_StartUnloadTime)-ISODate(this.ActualDepartureTime)) >= 1200000 &&
                                        (ISODate(this.STS_StartUnloadTime)-ISODate(this.ActualDepartureTime)) < 2400000
                                        `};
                cursor.find(query4_3).count().then((n) => {
                    let persentage = (n*100)/totalDocuments;
                    console.log(`       (d >= 20 min && d < 40 min) : ${n} , ${persentage.toFixed(2)} %`);  
                });

                //STS_StartUnloadTime > ActualDepartureTime
                //Start unloading after leaving the Geofence
                //d >= 40 
                var query4_4 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                                        this.STS_StartUnloadTime != '' && this.STS_EndUnloadTime != '' && 
                                        this.ActualArrivalTime != '' && this.ActualDepartureTime != '' && 
                                        ISODate(this.STS_StartUnloadTime) > ISODate(this.ActualDepartureTime) &&
                                        (ISODate(this.STS_StartUnloadTime)-ISODate(this.ActualDepartureTime)) >= 2400000
                                        `};
                cursor.find(query4_4).count().then((n) => {
                    let persentage = (n*100)/totalDocuments;
                    console.log(`       (d >= 40 min) : ${n} , ${persentage.toFixed(2)} % \n`);  
                });



    //STS_EndUnloadTime < ActualArrivalTime
    //End unloading before entering geofence
    var query5 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                            this.STS_StartUnloadTime != '' && this.STS_EndUnloadTime != '' && 
                            this.ActualArrivalTime != '' && this.ActualDepartureTime != '' && 
                            ISODate(this.STS_EndUnloadTime) < ISODate(this.ActualArrivalTime) `};
    cursor.find(query5).count().then((n) => {
        let persentage = (n*100)/totalDocuments;
        console.log(`End unloading before entering geofence : ${n} , ${persentage.toFixed(2)} %`);  
    });

                //STS_EndUnloadTime < ActualArrivalTime
                //End unloading before entering geofence
                //d < -40
                var query5_1 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                                        this.STS_StartUnloadTime != '' && this.STS_EndUnloadTime != '' && 
                                        this.ActualArrivalTime != '' && this.ActualDepartureTime != '' && 
                                        ISODate(this.STS_EndUnloadTime) < ISODate(this.ActualArrivalTime) &&
                                        (ISODate(this.STS_EndUnloadTime)-ISODate(this.ActualArrivalTime)) < -2400000
                                        `};
                cursor.find(query5_1).count().then((n) => {
                    let persentage = (n*100)/totalDocuments;
                    console.log(`       (d < -40 min): ${n} , ${persentage.toFixed(2)} %`);  
                });

                //STS_EndUnloadTime < ActualArrivalTime
                //End unloading before entering geofence
                //d < -20 && d >= -40
                var query5_2 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                                        this.STS_StartUnloadTime != '' && this.STS_EndUnloadTime != '' && 
                                        this.ActualArrivalTime != '' && this.ActualDepartureTime != '' && 
                                        ISODate(this.STS_EndUnloadTime) < ISODate(this.ActualArrivalTime) &&
                                        (ISODate(this.STS_EndUnloadTime)-ISODate(this.ActualArrivalTime)) >= -2400000 &&
                                        (ISODate(this.STS_EndUnloadTime)-ISODate(this.ActualArrivalTime)) < -1200000
                                        `};
                cursor.find(query5_2).count().then((n) => {
                    let persentage = (n*100)/totalDocuments;
                    console.log(`       (d < -20 min && d >= -40 min): ${n} , ${persentage.toFixed(2)} %`);  
                });

                //STS_EndUnloadTime < ActualArrivalTime
                //End unloading before entering geofence
                //d < -10 && d >= -20
                var query5_3 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                                        this.STS_StartUnloadTime != '' && this.STS_EndUnloadTime != '' && 
                                        this.ActualArrivalTime != '' && this.ActualDepartureTime != '' && 
                                        ISODate(this.STS_EndUnloadTime) < ISODate(this.ActualArrivalTime) &&
                                        (ISODate(this.STS_EndUnloadTime)-ISODate(this.ActualArrivalTime)) >= -1200000 &&
                                        (ISODate(this.STS_EndUnloadTime)-ISODate(this.ActualArrivalTime)) < -600000
                                        `};
                cursor.find(query5_3).count().then((n) => {
                    let persentage = (n*100)/totalDocuments;
                    console.log(`       (d < -10 min && d >= -20 min): ${n} , ${persentage.toFixed(2)} %`);  
                });

                //STS_EndUnloadTime < ActualArrivalTime
                //End unloading before entering geofence
                //d < 0 && d >= -10
                var query5_4 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                                        this.STS_StartUnloadTime != '' && this.STS_EndUnloadTime != '' && 
                                        this.ActualArrivalTime != '' && this.ActualDepartureTime != '' && 
                                        ISODate(this.STS_EndUnloadTime) < ISODate(this.ActualArrivalTime) &&
                                        (ISODate(this.STS_EndUnloadTime)-ISODate(this.ActualArrivalTime)) >= -600000 &&
                                        (ISODate(this.STS_EndUnloadTime)-ISODate(this.ActualArrivalTime)) < 0
                                        `};
                cursor.find(query5_4).count().then((n) => {
                    let persentage = (n*100)/totalDocuments;
                    console.log(`       (d < 0 min && d >= -10 min): ${n} , ${persentage.toFixed(2)} %\n`);  
                });

    //STS_EndUnloadTime > ActualDepartureTime
    //End unloading after leaving geofence
    var query6 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                            this.STS_StartUnloadTime != '' && this.STS_EndUnloadTime != '' && 
                            this.ActualArrivalTime != '' && this.ActualDepartureTime != '' && 
                            ISODate(this.STS_EndUnloadTime) > ISODate(this.ActualDepartureTime) `};
    cursor.find(query6).count().then((n) => {
        let persentage = (n*100)/totalDocuments;
        console.log(`End unloading after leaving geofence : ${n} , ${persentage.toFixed(2)} %`); 
    });

                //STS_EndUnloadTime > ActualDepartureTime
                //End unloading after leaving geofence
                //d >= 0 && d < 10
                var query6_1 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                                        this.STS_StartUnloadTime != '' && this.STS_EndUnloadTime != '' && 
                                        this.ActualArrivalTime != '' && this.ActualDepartureTime != '' && 
                                        ISODate(this.STS_EndUnloadTime) > ISODate(this.ActualDepartureTime) &&
                                        (ISODate(this.STS_EndUnloadTime)-ISODate(this.ActualDepartureTime)) >= 0 &&
                                        (ISODate(this.STS_EndUnloadTime)-ISODate(this.ActualDepartureTime)) < 600000
                                        `};
                cursor.find(query6_1).count().then((n) => {
                    let persentage = (n*100)/totalDocuments;
                    console.log(`       (d >= 0 min && d < 10 min): ${n} , ${persentage.toFixed(2)} %`); 
                });

                //STS_EndUnloadTime > ActualDepartureTime
                //End unloading after leaving geofence
                //d >= 10 && d < 20
                var query6_2 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                                        this.STS_StartUnloadTime != '' && this.STS_EndUnloadTime != '' && 
                                        this.ActualArrivalTime != '' && this.ActualDepartureTime != '' && 
                                        ISODate(this.STS_EndUnloadTime) > ISODate(this.ActualDepartureTime) &&
                                        (ISODate(this.STS_EndUnloadTime)-ISODate(this.ActualDepartureTime)) >= 600000 &&
                                        (ISODate(this.STS_EndUnloadTime)-ISODate(this.ActualDepartureTime)) < 1200000
                                        `};
                cursor.find(query6_2).count().then((n) => {
                    let persentage = (n*100)/totalDocuments;
                    console.log(`       (d >= 10 min && d < 20 min): ${n} , ${persentage.toFixed(2)} %`); 
                });

                //STS_EndUnloadTime > ActualDepartureTime
                //End unloading after leaving geofence
                //d >= 20 && d < 40
                var query6_3 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                                        this.STS_StartUnloadTime != '' && this.STS_EndUnloadTime != '' && 
                                        this.ActualArrivalTime != '' && this.ActualDepartureTime != '' && 
                                        ISODate(this.STS_EndUnloadTime) > ISODate(this.ActualDepartureTime) &&
                                        (ISODate(this.STS_EndUnloadTime)-ISODate(this.ActualDepartureTime)) >= 1200000 &&
                                        (ISODate(this.STS_EndUnloadTime)-ISODate(this.ActualDepartureTime)) < 2400000
                                        `};
                cursor.find(query6_3).count().then((n) => {
                    let persentage = (n*100)/totalDocuments;
                    console.log(`       (d >= 20 min && d < 40 min): ${n} , ${persentage.toFixed(2)} %`); 
                });

                //STS_EndUnloadTime > ActualDepartureTime
                //End unloading after leaving geofence
                //d >= 40
                var query6_4 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                                        this.STS_StartUnloadTime != '' && this.STS_EndUnloadTime != '' && 
                                        this.ActualArrivalTime != '' && this.ActualDepartureTime != '' && 
                                        ISODate(this.STS_EndUnloadTime) > ISODate(this.ActualDepartureTime) &&
                                        (ISODate(this.STS_EndUnloadTime)-ISODate(this.ActualDepartureTime)) >= 2400000
                                        `};
                cursor.find(query6_4).count().then((n) => {
                    let persentage = (n*100)/totalDocuments;
                    console.log(`       (d >= 40 min): ${n} , ${persentage.toFixed(2)} %\n`); 
                });

    //// 
    //STS_FirstScanTime < ActualArrivalTime
    //Start scanning items before entering the geofence 
    var query7 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                            this.STS_FirstScanTime != '' &&  this.ActualArrivalTime != '' &&  
                            ISODate(this.STS_FirstScanTime) < ISODate(this.ActualArrivalTime) `};
    cursor.find(query7).count().then((n) => {
        let persentage = (n*100)/totalDocuments;
        console.log(`Start scanning items before entering the geofence : ${n} , ${persentage.toFixed(2)} % `);   
    });

                //Start scanning items before entering the geofence  
                //STS_FirstScanTime < ActualArrivalTime
                //d < -40
                var query7_1 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                                        this.STS_FirstScanTime != '' &&  this.ActualArrivalTime != '' &&
                                        ISODate(this.STS_FirstScanTime) < ISODate(this.ActualArrivalTime) &&
                                        (ISODate(this.STS_FirstScanTime)-ISODate(this.ActualArrivalTime)) < -2400000
                                        `};
                cursor.find(query7_1).count().then((n) => {
                    let persentage = (n*100)/totalDocuments;
                    console.log(`       (d < -40 min): ${n} , ${persentage.toFixed(2)} % `);   
                });

                //Start scanning items before entering the geofence  
                //STS_FirstScanTime < ActualArrivalTime
                //d < -20 && d >= -40
                var query7_2 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                                        this.STS_FirstScanTime != '' &&  this.ActualArrivalTime != '' && 
                                        ISODate(this.STS_FirstScanTime) < ISODate(this.ActualArrivalTime) &&
                                        (ISODate(this.STS_FirstScanTime)-ISODate(this.ActualArrivalTime)) >= -2400000 &&
                                        (ISODate(this.STS_FirstScanTime)-ISODate(this.ActualArrivalTime)) < -1200000
                                        `};
                cursor.find(query7_2).count().then((n) => {
                    let persentage = (n*100)/totalDocuments;
                    console.log(`       (d < -20 min && d >= -40 min): ${n} , ${persentage.toFixed(2)} % `);   
                });

                //Start scanning items before entering the geofence  
                //STS_FirstScanTime < ActualArrivalTime
                //d < -10 && d >= -20
                var query7_3 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                                        this.STS_FirstScanTime != '' &&  this.ActualArrivalTime != '' && 
                                        ISODate(this.STS_FirstScanTime) < ISODate(this.ActualArrivalTime) &&
                                        (ISODate(this.STS_FirstScanTime)-ISODate(this.ActualArrivalTime)) >= -1200000 &&
                                        (ISODate(this.STS_FirstScanTime)-ISODate(this.ActualArrivalTime)) < -600000
                                        `};
                cursor.find(query7_3).count().then((n) => {
                    let persentage = (n*100)/totalDocuments;
                    console.log(`       (d < -10 min && d >= -20 min): ${n} , ${persentage.toFixed(2)} % `);   
                });

                //Start scanning items before entering the geofence  
                //STS_FirstScanTime < ActualArrivalTime
                //d < 0 && d >= -10
                var query7_4 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                                        this.STS_FirstScanTime != '' &&  this.ActualArrivalTime != '' && 
                                        ISODate(this.STS_FirstScanTime) < ISODate(this.ActualArrivalTime) &&
                                        (ISODate(this.STS_FirstScanTime)-ISODate(this.ActualArrivalTime)) >= -600000 &&
                                        (ISODate(this.STS_FirstScanTime)-ISODate(this.ActualArrivalTime)) < 0
                                        `};
                cursor.find(query7_4).count().then((n) => {
                    let persentage = (n*100)/totalDocuments;
                    console.log(`       (d < 0 min && d >= -10 min): ${n} , ${persentage.toFixed(2)} % \n`);   
                });



    //STS_LastScanTime > ActualDepartureTime
    //End scanning items after leaving the geofence 
    var query8 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                            this.STS_LastScanTime != '' && this.ActualDepartureTime != '' && 
                            ISODate(this.STS_LastScanTime) > ISODate(this.ActualDepartureTime) `};
    cursor.find(query8).count().then((n) => {
        let persentage = (n*100)/totalDocuments;
        console.log(`End scanning items after leaving the geofence : ${n} , ${persentage.toFixed(2)} % `);  
    });

                //STS_LastScanTime > ActualDepartureTime
                //End scanning items after leaving the geofence
                //d >= 0 && d < 10
                var query8_1 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                                        this.STS_LastScanTime != '' && this.ActualDepartureTime != '' &&  
                                        ISODate(this.STS_LastScanTime) > ISODate(this.ActualDepartureTime) &&
                                        (ISODate(this.STS_LastScanTime)-ISODate(this.ActualDepartureTime)) >= 0 &&
                                        (ISODate(this.STS_LastScanTime)-ISODate(this.ActualDepartureTime)) < 600000
                                        `};
                cursor.find(query8_1).count().then((n) => {
                    let persentage = (n*100)/totalDocuments;

                    console.log(`       (d >= 0 min && d < 10 min) : ${n} , ${persentage.toFixed(2)} %`);  
                });

                //STS_LastScanTime > ActualDepartureTime
                //End scanning items after leaving the geofence
                //d >= 10 && d < 20 
                var query8_2 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                                        this.STS_LastScanTime != '' && this.ActualDepartureTime != '' && 
                                        ISODate(this.STS_LastScanTime) > ISODate(this.ActualDepartureTime) &&
                                        (ISODate(this.STS_LastScanTime)-ISODate(this.ActualDepartureTime)) >= 600000 &&
                                        (ISODate(this.STS_LastScanTime)-ISODate(this.ActualDepartureTime)) < 1200000
                                        `};
                cursor.find(query8_2).count().then((n) => {
                    let persentage = (n*100)/totalDocuments;
                    console.log(`       (d >= 10 min && d < 20 min) : ${n} , ${persentage.toFixed(2)} %`);  
                });

                //STS_LastScanTime > ActualDepartureTime
                //End scanning items after leaving the geofence
                //d >= 20 && d < 40 
                var query8_3 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                                        this.STS_LastScanTime != '' && this.ActualDepartureTime != '' && 
                                        ISODate(this.STS_LastScanTime) > ISODate(this.ActualDepartureTime) &&
                                        (ISODate(this.STS_LastScanTime)-ISODate(this.ActualDepartureTime)) >= 1200000 &&
                                        (ISODate(this.STS_LastScanTime)-ISODate(this.ActualDepartureTime)) < 2400000
                                        `};
                cursor.find(query8_3).count().then((n) => {
                    let persentage = (n*100)/totalDocuments;
                    console.log(`       (d >= 20 min && d < 40 min) : ${n} , ${persentage.toFixed(2)} %`);  
                });

                //STS_LastScanTime > ActualDepartureTime
                //End scanning items after leaving the geofence
                //d >= 40 
                var query8_4 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                                        this.STS_LastScanTime != '' && this.ActualDepartureTime != '' && 
                                        ISODate(this.STS_LastScanTime) > ISODate(this.ActualDepartureTime) &&
                                        (ISODate(this.STS_LastScanTime)-ISODate(this.ActualDepartureTime)) >= 2400000
                                        `};
                cursor.find(query8_4).count().then((n) => {
                    let persentage = (n*100)/totalDocuments;
                    console.log(`       (d >= 40 min) : ${n} , ${persentage.toFixed(2)} % \n`);  
                });

    


    //STS_FirstScanTime < STS_StartUnloadTime
    //Scanning items before starting unload 
    var query9 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                            this.STS_FirstScanTime != '' &&  this.STS_StartUnloadTime != '' &&  
                            ISODate(this.STS_FirstScanTime) < ISODate(this.STS_StartUnloadTime) `};
    cursor.find(query9).count().then((n) => {
        let persentage = (n*100)/totalDocuments;
        console.log(`Scanning items before starting unload : ${n} , ${persentage.toFixed(6)} % `);  
        console.log(`[ d' = STS_FirstScanTime - STS_StartUnloadTime]`); 
    });

                //Scanning items before starting unload 
                //STS_FirstScanTime < STS_StartUnloadTime
                //d < -40
                var query9_1 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                                        this.STS_FirstScanTime != '' &&  this.STS_StartUnloadTime != '' &&
                                        ISODate(this.STS_FirstScanTime) < ISODate(this.STS_StartUnloadTime) &&
                                        (ISODate(this.STS_FirstScanTime)-ISODate(this.STS_StartUnloadTime)) < -2400000
                                        `};
                cursor.find(query9_1).count().then((n) => {
                    let persentage = (n*100)/totalDocuments;
                    console.log(`       (d' < -40 min): ${n} , ${persentage.toFixed(6)} % `);   
                });

                //Scanning items before starting unload 
                //STS_FirstScanTime < STS_StartUnloadTime
                //d < -20 && d >= -40
                var query9_2 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                                        this.STS_FirstScanTime != '' &&  this.STS_StartUnloadTime != '' && 
                                        ISODate(this.STS_FirstScanTime) < ISODate(this.STS_StartUnloadTime) &&
                                        (ISODate(this.STS_FirstScanTime)-ISODate(this.STS_StartUnloadTime)) >= -2400000 &&
                                        (ISODate(this.STS_FirstScanTime)-ISODate(this.STS_StartUnloadTime)) < -1200000
                                        `};
                cursor.find(query9_2).count().then((n) => {
                    let persentage = (n*100)/totalDocuments;
                    console.log(`       (d' < -20 min && d' >= -40 min): ${n} , ${persentage.toFixed(6)} % `);   
                });

                //Scanning items before starting unload 
                //STS_FirstScanTime < STS_StartUnloadTime
                //d < -10 && d >= -20
                var query9_3 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                                        this.STS_FirstScanTime != '' &&  this.STS_StartUnloadTime != '' && 
                                        ISODate(this.STS_FirstScanTime) < ISODate(this.STS_StartUnloadTime) &&
                                        (ISODate(this.STS_FirstScanTime)-ISODate(this.STS_StartUnloadTime)) >= -1200000 &&
                                        (ISODate(this.STS_FirstScanTime)-ISODate(this.STS_StartUnloadTime)) < -600000
                                        `};
                cursor.find(query9_3).count().then((n) => {
                    let persentage = (n*100)/totalDocuments;
                    console.log(`       (d' < -10 min && d' >= -20 min): ${n} , ${persentage.toFixed(6)} % `);   
                });

                //Scanning items before starting unload  
                //STS_FirstScanTime < STS_StartUnloadTime
                //d < 0 && d >= -10
                var query9_4 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                                        this.STS_FirstScanTime != '' &&  this.STS_StartUnloadTime != '' && 
                                        ISODate(this.STS_FirstScanTime) < ISODate(this.STS_StartUnloadTime) &&
                                        (ISODate(this.STS_FirstScanTime)-ISODate(this.STS_StartUnloadTime)) >= -600000 &&
                                        (ISODate(this.STS_FirstScanTime)-ISODate(this.STS_StartUnloadTime)) < 0
                                        `};
                cursor.find(query9_4).count().then((n) => {
                    let persentage = (n*100)/totalDocuments;
                    console.log(`       (d' < 0 min && d' >= -10 min): ${n} , ${persentage.toFixed(6)} % \n`);   
                });




    //STS_LastScanTime > STS_EndUnloadTime
    //Scanning items after ending unload 
    var query10 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                            this.STS_LastScanTime != '' && this.STS_EndUnloadTime != '' && 
                            ISODate(this.STS_LastScanTime) > ISODate(this.STS_EndUnloadTime) `};
    cursor.find(query10).count().then((n) => {
        let persentage = (n*100)/totalDocuments;
        console.log(`Scanning items after ending unload : ${n} , ${persentage.toFixed(2)} % `);
        console.log(`[ d" = STS_LastScanTime - STS_EndUnloadTime]`);   
    });

                //STS_LastScanTime > STS_EndUnloadTime
                //Scanning items after ending unload
                //d >= 0 && d < 10
                var query10_1 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                                        this.STS_LastScanTime != '' && this.STS_EndUnloadTime != '' &&  
                                        ISODate(this.STS_LastScanTime) > ISODate(this.STS_EndUnloadTime) &&
                                        (ISODate(this.STS_LastScanTime)-ISODate(this.STS_EndUnloadTime)) >= 0 &&
                                        (ISODate(this.STS_LastScanTime)-ISODate(this.STS_EndUnloadTime)) < 600000
                                        `};
                cursor.find(query10_1).count().then((n) => {
                    let persentage = (n*100)/totalDocuments;

                    console.log(`       (d" >= 0 min && d" < 10 min) : ${n} , ${persentage.toFixed(2)} %`);  
                });

                //STS_LastScanTime > STS_EndUnloadTime
                //Scanning items after ending unload
                //d >= 10 && d < 20 
                var query10_2 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                                        this.STS_LastScanTime != '' && this.STS_EndUnloadTime != '' && 
                                        ISODate(this.STS_LastScanTime) > ISODate(this.STS_EndUnloadTime) &&
                                        (ISODate(this.STS_LastScanTime)-ISODate(this.STS_EndUnloadTime)) >= 600000 &&
                                        (ISODate(this.STS_LastScanTime)-ISODate(this.STS_EndUnloadTime)) < 1200000
                                        `};
                cursor.find(query10_2).count().then((n) => {
                    let persentage = (n*100)/totalDocuments;
                    console.log(`       (d" >= 10 min && d" < 20 min) : ${n} , ${persentage.toFixed(2)} %`);  
                });

                //STS_LastScanTime > STS_EndUnloadTime
                //Scanning items after ending unload
                //d >= 20 && d < 40 
                var query10_3 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                                        this.STS_LastScanTime != '' && this.STS_EndUnloadTime != '' && 
                                        ISODate(this.STS_LastScanTime) > ISODate(this.STS_EndUnloadTime) &&
                                        (ISODate(this.STS_LastScanTime)-ISODate(this.STS_EndUnloadTime)) >= 1200000 &&
                                        (ISODate(this.STS_LastScanTime)-ISODate(this.STS_EndUnloadTime)) < 2400000
                                        `};
                cursor.find(query10_3).count().then((n) => {
                    let persentage = (n*100)/totalDocuments;
                    console.log(`       (d" >= 20 min && d" < 40 min) : ${n} , ${persentage.toFixed(2)} %`);  
                });

                //STS_LastScanTime > STS_EndUnloadTime
                //Scanning items after ending unload
                //d >= 40 
                var query10_4 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                                        this.STS_LastScanTime != '' && this.STS_EndUnloadTime != '' && 
                                        ISODate(this.STS_LastScanTime) > ISODate(this.STS_EndUnloadTime) &&
                                        (ISODate(this.STS_LastScanTime)-ISODate(this.STS_EndUnloadTime)) >= 2400000
                                        `};
                cursor.find(query10_4).count().then((n) => {
                    let persentage = (n*100)/totalDocuments;
                    console.log(`       (d" >= 40 min) : ${n} , ${persentage.toFixed(2)} % \n`);  
                });
    ////



    //STS_StartUnloadTime is empty AND STS_EndUnloadTime is not empty.
    //Start unload data is not available and End unload data is available
    var query11 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                            this.STS_StartUnloadTime == '' && this.STS_EndUnloadTime != '' `};
    cursor.find(query11).count().then((n) => {
        let persentage = (n*100)/totalDocuments;
        console.log(`Start unload data is not available and End unload data is available : ${n} , ${persentage.toFixed(2)} %`); 
    });

    //STS_StartUnloadTime is not empty AND STS_EndUnloadTime is empty.
    //Start unload data is available and End unload data is not available
    var query12 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                            this.STS_StartUnloadTime != '' && this.STS_EndUnloadTime == '' `};
    cursor.find(query12).count().then((n) => {
        let persentage = (n*100)/totalDocuments;
        console.log(`Start unload data is available and End unload data is not available : ${n} , ${persentage.toFixed(2)} % \n`); 

    });

    //STS_StartUnloadTime is empty AND STS_EndUnloadTime is empty.
    //STS data not available
    var query13 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                            this.STS_StartUnloadTime == '' && this.STS_EndUnloadTime == '' `};
    cursor.find(query13).count().then((n) => {
        let persentage = (n*100)/totalDocuments;
        console.log(`Unload data not available : ${n} , ${persentage.toFixed(2)} % \n`);  
    });

    //STS_StartUnloadTime & STS_EndUnloadTime are not empty AND ActualArrivalTime & ActualDepartureTime are empty. 
    //STS data availbale and Geofence data not available
    var query14 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                            this.STS_StartUnloadTime != '' && this.STS_EndUnloadTime != '' && 
                            this.ActualArrivalTime == '' && this.ActualDepartureTime == '' `};
    cursor.find(query14).count().then((n) => {
        let persentage = (n*100)/totalDocuments;
        console.log(`Unload data available and Geofence data not available : ${n} , ${persentage.toFixed(2)} % \n`);   
    });

    //STS_StartUnloadTime present and STS_FirstScanTime not available
    var query15 = { $where: `ISODate(this.ExpectedArrivalTime) >= ISODate('${from}') && ISODate(this.ExpectedArrivalTime) < ISODate('${to}') &&
                            this.STS_StartUnloadTime != '' && this.STS_FirstScanTime == '' `};
    cursor.find(query15).count().then((n) => {
        let persentage = (n*100)/totalDocuments;
        console.log(`Unload data available and first-scan data not available : ${n} , ${persentage.toFixed(2)} % \n`);   
    });


    callback();
};




