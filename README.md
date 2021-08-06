<!--
title: 'seccamp B3 demo app'
description: 'This app demonstrates how to make micro blog'
layout: Doc
framework: v2
platform: AWS
language: nodeJS
-->

# B3 サンプルアプリ (API)

基本的なログイン機能を備えたユーザー投稿型アプリケーションのサンプルです。

## 利用方法

### Settings

あらかじめAuth0側で「Application」と「API」を設定しておきます。

* serverless.yml
  * 26行目の<code>arn:aws:s3:::sc2021b3-demoapp-0000/*</code>の0000の部分を、
    0000を自分に割り当てられた番号に変更
  * 33行目の<code>issuerUrl: https://dev-9zllcerz.us.auth0.com/</code>の部分を、
    自分のAuth0ドメイン名に変更
  * 74行目の<code>BucketName: 'sc2021b3-demoapp-0000'</code>の0000の部分を、
    26行目と同じく自分に割り当てられた番号に変更
* handler.js
  * 8行目の<code>const imageBucketName = 'sc2021b3-demoapp-0000';</code>の0000の部分を、
    自分に割り当てられた場号に変更
  * 9行目の<code>const userinfoUrl = 'https://dev-9zllcerz.us.auth0.com/userinfo';</code>
    の部分を、自分のAuth0ドメイン名に変更


### デプロイ

`deploy`コマンドで実際のAWS環境にデプロイします。

```
$ serverless deploy
```

もしくは`sls`というショートカットコマンドが用意されているので、

```
$ sls deploy
```
