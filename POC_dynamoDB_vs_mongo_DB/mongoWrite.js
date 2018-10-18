const MongoClient = require("mongodb").MongoClient;
const perf = require('execution-time')();

const numTestDocs = 100; // or however many you want
const someLength = 12;
function createRandomWord(length) {
  var consonants = "bcdfghjklmnpqrstvwxyz",
    vowels = "aeiou",
    rand = function(limit) {
      return Math.floor(Math.random() * limit);
    },
    i,
    word = "",
    length = parseInt(length, 10),
    consonants = consonants.split(""),
    vowels = vowels.split("");
  for (i = 0; i < length / 2; i++) {
    let randConsonant = consonants[rand(consonants.length)],
      randVowel = vowels[rand(vowels.length)];
    word += i === 0 ? randConsonant.toUpperCase() : randConsonant;
    word += i * 2 < length - 1 ? randVowel : "";
  }
  return word;
}

let dataToStore = [];
for (let i = 0; i < numTestDocs; i++) {
  const randomWord = createRandomWord(someLength);
  const randomWord1 = createRandomWord(20);
  const item = {
        "ID": i,
        "actualArrivalTime" : Date.now(),
        "actualDepartureTime" : Date.now(),
        "customerId" : Math.random()*1000000,
        "Num": Math.random()*10,
        "Username": randomWord,
        "JobKey": "0132018-08-02421301",
        "ExpectedArrivalTime": Date.now(),
        "ExpectedDepartureTime": Date.now(),
        "EstimatedArrivalTime": Date.now(),
        "ActualArrivalTime": Date.now(),
        "ActualDepartureTime": Date.now(),
        "ExpectedStopTime": (Math.random()*100).toString(),
        "JobStatus": "Completed",
        "UnitId": "1009958827",
        "notificationActivities": [
          {
            "deliveryStatus": randomWord,
            "messagingType": "INITIAL",
            "projectedArrivalTime": Date.now(),
            "sentAt": Date.now(),
            "stsEndUnloadTime": Date.now(),
            "stsStartUnloadTime": Date.now(),
            "telogisActualArrivalTime": Date.now(),
            "telogisActualDepartureTime": Date.now()
          },
          {
            "deliveryStatus": randomWord,
            "messagingType": "INITIAL",
            "projectedArrivalTime": Date.now(),
            "sentAt": Date.now(),
            "stsEndUnloadTime": Date.now(),
            "stsStartUnloadTime": Date.now(),
            "telogisActualArrivalTime": Date.now(),
            "telogisActualDepartureTime": Date.now()
          },{
            "deliveryStatus": randomWord,
            "messagingType": "INITIAL",
            "projectedArrivalTime": Date.now(),
            "sentAt": Date.now(),
            "stsEndUnloadTime": Date.now(),
            "stsStartUnloadTime": Date.now(),
            "telogisActualArrivalTime": Date.now(),
            "telogisActualDepartureTime": Date.now()
          },{
            "deliveryStatus": randomWord,
            "messagingType": "INITIAL",
            "projectedArrivalTime": Date.now(),
            "sentAt": Date.now(),
            "stsEndUnloadTime": Date.now(),
            "stsStartUnloadTime": Date.now(),
            "telogisActualArrivalTime": Date.now(),
            "telogisActualDepartureTime": Date.now()
          },{
            "deliveryStatus": randomWord,
            "messagingType": "INITIAL",
            "projectedArrivalTime": Date.now(),
            "sentAt": Date.now(),
            "stsEndUnloadTime": Date.now(),
            "stsStartUnloadTime": Date.now(),
            "telogisActualArrivalTime": Date.now(),
            "telogisActualDepartureTime": Date.now()
          }
        ],
        "EstimatedDistance": "",
        "RouteId": randomWord1,
        "RouteStatus": "Complete",
        "DriverId": "1330547324",
        "DriverName": randomWord1,
        "Lat": "31.4989995359778",
        "Lon": "-97.2205996346831",
        "JobTypeId": randomWord1,
        "CustID": "013066142",
        "MarkerId": "1086365971",
        "STS_DriverID": "50086329",
        "STS_FirstScanTime": Date.now(),
        "STS_LastScanTime": Date.now(),
        "STS_StartUnloadTime": Date.now(),
        "STS_EndUnloadTime": Date.now()
      }
  dataToStore.push(item);
}



// replace the uri string with your connection string.
const uri =
  "mongodb+srv://malith:H94JPAexcXPMTXLU@mycluster-f7t34.mongodb.net/test";
MongoClient.connect(
  uri,
  { useNewUrlParser: true },
  function(err, client) {
    if (err) {
      console.log("Error occurred while connecting to MongoDB Atlas...\n", err);
    }
    console.log("Connected...");
    perf.start(); 
    const collection = client.db("test").collection("devices").insertMany(dataToStore, () => {
      client.close();
      const results = perf.stop();
      console.log('Time: ', results);

      console.log('finished...');
    } );    
  }
);
