"use strict";
const fetch = require('node-fetch');
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const parser = require('lambda-multipart-parser');

const imageBucketName = 'sc2021b3-demoapp-0000';
const userinfoUrl = 'https://dev-9zllcerz.us.auth0.com/userinfo';

// Auth0のuserinfoエンドポイントからユーザ情報を取得
const getUserinfo = async (event) => {
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

// GET /
// 指定されたユーザの新着投稿一覧を表示するAPI
// 対象はクエリ文字列 user で指定するが、省略した場合はログインユーザ
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

  // 消費したCapacityをログ出力
  console.info(`Query: table=posts consumed=${posts.ConsumedCapacity.CapacityUnits}`);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({event, userinfo, posts: posts.Items}, null, 2),
  };
};

// POST /
// 投稿API
// JSONでうけつけ、bodyをメッセージ本文としてDynamoDBに登録する。
module.exports.post = async (event) => {
  const userinfo = await getUserinfo(event);
  const request = await parser.parse(event);
  console.log(JSON.stringify(request));

  const body = request?.body;

  if (!body?.length) {
    return {
      statusCode: 400, // Bad Request
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({event, userinfo}, null, 2),
    };
  }

  const timestamp = Math.floor(Date.now() / 1000);

  // 画像がある場合はS3に保存
  let imageUrl;
  if (request.files.length > 0) {
    const imageFilename = `${userinfo.name}_${timestamp}`;
    await s3.putObject({
      Bucket: imageBucketName,
      Key: imageFilename,
      Body: request.files[0].content,
      ContentType: 'image/jpeg',
      ACL: 'public-read',
    }).promise();
    imageUrl = `https://${imageBucketName}.s3-ap-northeast-1.amazonaws.com/${imageFilename}`;
  }

  const result = await dynamodb.put({
    TableName: 'posts',
    Item: {
      username: userinfo.name,
      created_at: timestamp,
      body,
      imageUrl,
    },
    ReturnConsumedCapacity: 'INDEXES',
  }).promise();

  // 消費したCapacityをログ出力
  console.info(`Query: table=posts consumed=${result.ConsumedCapacity.CapacityUnits}`);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({event, userinfo, imageUrl}, null, 2),
  };
};