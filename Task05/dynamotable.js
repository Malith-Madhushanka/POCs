// amazon dynamo db create table using nodejs 
var AWS = require("aws-sdk");
AWS.config.update({
    region: "us-west-2",
    endpoint: "http://localhost:3306"   // 3306 is the port where we started our dynamo db 
});

var dynamodb = new AWS.DynamoDB();

var params = {  
    TableName: "Movies",        // name of the table 
    KeySchema: [
        { AttributeName: "year", KeyType: "HASH" }, //Partition key
        { AttributeName: "title", KeyType: "RANGE" } //Sort key
    ],
    AttributeDefinitions: [
        { AttributeName: "year", AttributeType: "N" },  // N stands for number
        { AttributeName: "title", AttributeType: "S" }  // S is a string 
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 10,
        WriteCapacityUnits: 10
    }
};


dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});
     
    