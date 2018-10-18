var AWS = require("aws-sdk");
var _ = require('lodash');
const perf = require('execution-time')();

let awsConfig = {
    "region": "us-east-1",
    "endpoint": "http://dynamodb.us-east-1.amazonaws.com",
    retryDelayOptions: {base: 300}
};
AWS.config.update(awsConfig);

let docClient = new AWS.DynamoDB.DocumentClient();

var numTestDocs = 100;
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
  const item = {
    PutRequest: {
      Item: {
        "ID": i,
        "Num": Math.random()*10,
        "Username": randomWord
      }
    }
  };
  dataToStore.push(item);
}

function save() {

    // var input = {
    //     "Message": "Testing...1...2...3",
    //     "Timestamp": "2016-11-21:14:32:19",
    //     "Username": "Jane Doe"
    //   };
    // var params = {
    //     TableName: "BarkTable",
    //     Item:  input
    // };

    // var params = {
    //     RequestItems: {
    //       "Test": dataToStore
    //     }
    //   };
    // docClient.batchWrite(params, function (err, data) {

    //     if (err) {
    //         console.log("users::save::error - " + JSON.stringify(err, null, 2));                      
    //     } else {
    //         console.log("users::save::success" );                      
    //     }
    // });


    _.chunk(dataToStore, 25).map((chunk) => {
        let params = {
            RequestItems: {
              "Test": chunk
            }
          };
        docClient.batchWrite(params, function (err, data) {
    
            if (err) {
                console.log("users::save::error - " + JSON.stringify(err, null, 2));                      
            } else {
                console.log("users::save::success" );                      
            }
        });
    });
    
}
perf.start(); 
save();
const results = perf.stop();
console.log(results);