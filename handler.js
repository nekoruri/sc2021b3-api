"use strict";
const fetch = require('node-fetch');
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const getUserinfo = async (event) => {
  const userinfoUrl = 'https://dev-9zllcerz.us.auth0.com/userinfo';

  try {
    const response = await fetch(userinfoUrl, {
      headers: {
        Authorization: event.headers.authorization,
      }
    });

    console.log(`status: ${response.status}`);

    return await response.json();
  } catch (error) {
    console.error(error);
  }
};

module.exports.get = async (event) => {
  const userinfo = await getUserinfo(event);

  // queryStringでuserが指定されたらそれを対象に、
  // 指定されていなければログインユーザを対象にする
  const target = event?.queryStringParameters?.user || userinfo.name;

  // postsテーブルからユーザー名を指定して新しい順に10件取得
  const posts = (await dynamodb.query({
    TableName: 'posts',
    KeyConditionExpression: 'username = :username',
    ExpressionAttributeValues: {':username': target},
    ScanIndexForward: false,
    Limit: 10,
    ReturnConsumedCapacity: 'INDEXES',
  }).promise());
  console.info(`Query: table=posts consumed=${posts.ConsumedCapacity.CapacityUnits}`);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({event, userinfo, posts: posts.Items}, null, 2),
  };
};

module.exports.post = async (event) => {
  const userinfo = await getUserinfo(event);

  let payload;
  try {
    payload = JSON.parse(event?.body);
  } catch (error) {
    console.error(error);
  }
  const body = payload?.body;

  if (body.length === 0) {
    return {
      statusCode: 400 // Bad Request
    };
  }

  const result = await dynamodb.put({
    TableName: 'posts',
    Item: {
      username: userinfo.name,
      created_at: (Date.now() / 1000),
      body,
    },
    ReturnConsumedCapacity: 'INDEXES',
  }).promise();
  console.info(`Query: table=posts consumed=${result.ConsumedCapacity.CapacityUnits}`);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({event, userinfo}, null, 2),
  };
};