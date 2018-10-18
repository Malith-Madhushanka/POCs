var AWS = require("aws-sdk");
var _ = require("lodash");
const perf = require("execution-time")();

let awsConfig = {
  region: "us-east-1",
  endpoint: "http://dynamodb.us-east-1.amazonaws.com",
  retryDelayOptions: { base: 300 }
};
AWS.config.update(awsConfig);

let docClient = new AWS.DynamoDB.DocumentClient();

var numTestDocs = 1000;
var someLength = 12;
let CHUNK_SIZE = 25;
let MAX_BATCH_WRITE_RETRY_COUNT = 10;

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
        ID: i,
        Num: Math.random() * 10,
        Username: randomWord
      }
    }
  };
  dataToStore.push(item);
}

const save = async () => {

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

  return Promise.all(
    _.chunk(dataToStore, CHUNK_SIZE).map(chunk => {
      batchWriteChunk(chunk);
    })
  );
  
};






batchWrite(tableName, items) {
  const mappingChunks = chunk(items, CHUNK_SIZE);
  return Promise.all(
    mappingChunks.map(mappingChunk =>
      batchWriteChunk(tableName, mappingChunk, 1)
    )
  );
}

batchWriteChunk(tableName, mappingChunk, iteration) {
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
    if (iteration > this.retryThreshold) {
      const errorMessage = `Error occurred: Exceeded maximum number of iterations [${this
        .retryThreshold}]. Items not written: [${params}]`;
      logger.error(errorMessage);
      reject({ message: errorMessage });
    } else {
      this.documentClient.batchWrite(params, (error, data) => {
        if (error) {
          logger.error(
            `Error occurred: ${error} Data: ${JSON.stringify(params)}`
          );
          reject(error);
        } else if (size(get(data, `UnprocessedItems.${tableName}`))) {
          const filteredChunk = _.intersectionWith(
            mappingChunk,
            get(data, `UnprocessedItems.${tableName}`),
            (chunkItem, unprocessedItem) =>
              get(chunkItem, 'invoice_key') ===
              get(unprocessedItem, 'PutRequest.Item.invoice_key')
          );

          logger.debug(
            `Found unprocessed items. Count: [${size(
              filteredChunk
            )}] Iteration: [${iteration}] Items: [${JSON.stringify(
              filteredChunk
            )}]`
          );

          setTimeout(
            () =>
              this.batchWriteChunk(tableName, filteredChunk, iteration + 1)
                .then(res => resolve(res))
                .catch(err => reject(err)),
            Math.pow(2, iteration) * 100 + Math.round(Math.random() * 1000)
          );
        } else {
          logger.debug(
            `Chunk written successfully. Size: [${size(
              mappingChunk
            )}] Iteration: [${iteration}]`
          );
          resolve(data);
        }
      });
    }
  });
}











const batchWriteChunk = chunk => {
  let params = {
    RequestItems: {
      Test: chunk
    }
  };

  return new Promise((resolve, reject) => {
    docClient.batchWrite(params, function(err, data) {
      if (err) {
        console.log("users::save::error - " + JSON.stringify(err, null, 2));
      } else {
        console.log("users::save::success");
        resolve('success');
      }
    });
  });
  
};

perf.start();
console.log('aaaaaaaaaa');

save().then(() => {
  const results = perf.stop();
  console.log("results:", results);
})

// console.log('bbbbbbbbbb');
// const results = perf.stop();
// console.log("results:", results);
