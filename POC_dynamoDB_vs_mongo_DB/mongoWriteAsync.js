const MongoClient = require("mongodb").MongoClient;
var async = require("async");
const perf = require('execution-time')();

var numTestDocs = 100;
var someLength = 12;
var mongodb;

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
    "ID": i,
    "Num": Math.random()*10,
    "Username": randomWord
  };
  dataToStore.push(item);
}

// replace the uri string with your connection string.
const uri =
  "mongodb+srv://malith:H94JPAexcXPMTXLU@mycluster-f7t34.mongodb.net/test";

perf.start();  
async.series(
  [
      // Establish Covalent Analytics MongoDB connection
      (callback) => {
          MongoClient.connect(uri, { useNewUrlParser: true }, (err, db) => {
              mongodb = db;
              callback(null);
          });
      },
      // Insert some documents
      (callback) => {
        const collection = mongodb.db("test").collection("devices").insertMany(dataToStore, () => {
          mongodb.close();
          console.log('finished storing...');
          const results = perf.stop();
          console.log(results);
        });
        callback(null);
      }
  ]
);