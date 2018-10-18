
var AWS = require("aws-sdk");
var _ = require('lodash');
const perf = require('execution-time')();

let awsConfig = {
    "region": "us-east-1",
    "endpoint": "http://dynamodb.us-east-1.amazonaws.com"
};
AWS.config.update(awsConfig);


const MAX_BATCH_WRITE_RETRY_COUNT = 20;
const MAX_BATCH_SIZE = 10;



let retryThreshold = MAX_BATCH_WRITE_RETRY_COUNT;
let chunkSize = MAX_BATCH_SIZE;

let documentClient = new AWS.DynamoDB.DocumentClient();
  
var numTestDocs = 1000;
var someLength = 12;

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
    var randConsonant = consonants[rand(consonants.length)],
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
        "Num": Math.random()*10,
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
          }
        ],
        "EstimatedDistance": Math.random()*100,
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




function batchWrite(tableName, items) {
    const mappingChunks = _.chunk(items,  chunkSize);

    return Promise.all(
      mappingChunks.map(mappingChunk =>
         batchWriteChunk(tableName, mappingChunk, 1)
      )
    );
  }

function batchWriteChunk(tableName, mappingChunk, iteration) {
    const params = {
      RequestItems: {
        [tableName]: [
          ...mappingChunk.map(item => {
            return {
              PutRequest: {
                Item: item
              }
            };
          })
        ]
      }
    };
    return new Promise((resolve, reject) => {
      if (iteration >  retryThreshold) {
        const errorMessage = `Error occurred: Exceeded maximum number of iterations [${this
          .retryThreshold}]. Items not written: [${params}]`;
        reject({ message: errorMessage });
      } else {
         documentClient.batchWrite(params, (error, data) => {
          if (error) {
            reject(error);
          } else if (_.size(_.get(data, `UnprocessedItems.${tableName}`))) {
            const filteredChunk = _.intersectionWith(
              mappingChunk,
              _.get(data, `UnprocessedItems.${tableName}`),
              (chunkItem, unprocessedItem) =>
                _.get(chunkItem, 'ID') ===
                _.get(unprocessedItem, 'PutRequest.Item.ID')
            );
            setTimeout(
              () =>
                 batchWriteChunk(tableName, filteredChunk, iteration + 1)
                  .then(res => resolve(res))
                  .catch(err => reject(err)),
              Math.pow(2, iteration) * 100 + Math.round(Math.random() * 1000)
            );
          } else {
            resolve(data);
          }
        });
      }
    });
  }

  async function test() {
    console.log('starting...');
    perf.start();
    await batchWrite('Test9', dataToStore);
    const results = perf.stop();
    console.log('Time: ', results);
    console.log('finished');
  }

  test();


