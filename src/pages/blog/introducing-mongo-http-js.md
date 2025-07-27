---
layout: '../../layouts/BlogLayout.astro'
title: 'Introducing mongo-http.js'
subtitle: An HTTP-based MongoDB Atlas connector for serverless runtimes (e.g., Cloudflare Workers and Deno Deploy) using the native Fetch API
date: 2023/01/05
tags:
  ['MongoDB', 'HTTP', 'Cloudflare', 'Workers', 'Deno', 'Node.js', 'Fetch API']
heroImagePath: '/images/blog/introducing-mongo-http-js/hero.webp'
---

#### Use Cases

- [mongo-http.js](https://github.com/patrick-kw-chiu/mongo-http.js) can be used when the client doesn’t support raw TCP connection but supports HTTP connection, e.g., certain serverless runtimes or Cloudflare Workers
- It can also be used in serverless runtimes where the reuse of a MongoDB connection [may not always be available](https://www.mongodb.com/developer/languages/javascript/developing-web-application-netlify-serverless-functions-mongodb/#conclusion) or [require manual caching](https://www.mongodb.com/developer/languages/javascript/integrate-mongodb-vercel-functions-serverless-experience/#conclusion)
- Sadly, it cannot be used on the browser side yet, due to [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS). Here is a [thread](https://feedback.mongodb.com/forums/945334-atlas-app-services/suggestions/44666878-please-support-cors-from-the-data-api) to request the CORS feature

#### Motivation

A few months ago, I migrated [Medium Rare](https://medium-rare.pages.dev/) (a Chinese articles scraper and searcher on Medium) [from Heroku to Cloudflare Workers](https://betterprogramming.pub/migrating-a-node-js-app-to-cloudflare-workers-from-heroku-62c679552af). I used the [MongoDB Data API](https://www.mongodb.com/docs/atlas/api/data-api-resources/) to replace the [MongoDB Node.js driver](https://www.mongodb.com/docs/drivers/node/current/). During the journey, I felt that I repeatedly made fetch calls to the Data API, and I do miss the familiar API of the Node.js driver. Therefore, I built this thin wrapper on top of the Data API, which I (and hopefully others) can use in future serverless projects!

##### Setup MongoDB Atlas to get the app ID and API key

Before using mongo-http.js (MongoDB Data API), you need to get the app ID and API key. See more detail in the [MongoDB Atlas tutorial](https://www.mongodb.com/docs/atlas/api/data-api/#get-started).

![get api id here](/images/blog/introducing-mongo-http-js/get-api-id-here.webp)

![get api key here](/images/blog/introducing-mongo-http-js/get-api-key-here.webp)

##### Installation

```
npm install mongo-http --save
```

##### Initialization

You can choose to initialize a `client`, a `database` or a `collection` as shown below. Usually, we would want to initialize a `database` connection.

You can initialize a client to connect to multiple databases as well.

```javascript
import { initClient } from 'mongo-http';
const client = initClient({
  appId: process.env.appId,
  apiKey: process.env.apiKey,
});
const db = client.database({ databaseName: process.env.databaseName });
const result = await db
  .collection('articles')
  .find({
    filter: {
      $or: [
        { categories: { $in: ['javascript', 'reactjs', 'nodejs', 'mongodb'] } },
      ],
    },
  });
```

##### How to initialize a database

```javascript
import { initDatabase } from 'mongo-http';
const db = initDatabase({
  appId: process.env.appId || '',
  apiKey: process.env.apiKey || '',
  databaseName: process.env.databaseName || '',
});
const result = await db.collection('articles').find({});
```

##### How to initialize a collection

```javascript
import { initCollection } from 'mongo-http';
const articlesCollection = initCollection({
  appId: process.env.appId || '',
  apiKey: process.env.apiKey || '',
  databaseName: process.env.databaseName || '',
  collectionName: 'articles',
});
const result = await articlesCollection.find({});
```

This mirrors [how the MongoDB Node.js driver initializes these three instances](https://www.mongodb.com/docs/drivers/node/current/fundamentals/connection/connect/#std-label-node-connect-to-mongodb).

```javascript
const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.uri);
await client.connect();

const db = client.db('<your database>');

const collection = db.collection('<your collection>');
const document = await collection.findOne({});
```

#### Tutorial and Examples

You can find the [GitHub `README.md` API doc](https://github.com/patrick-kw-chiu/mongo-http.js#api) here. The input parameters mirror the Data API but adopt similar APIs of the Node.js driver.

In the following, let’s dive into how to create (`insertOne`), read (`find`), update (`updateOne`) and delete (`deleteOne`) a document. Suppose we have two collections — `articles` and `writers` and the document looks like this:

```javascript
const article = {
  _id: 'article-1-object-id',
  writerId: 'patrick-writer-object-id',
  title: 'Migrating a Node.js App to Cloudflare Workers From Heroku',
  tags: ['javascript', 'cloudflare-workers', 'heroku', 'nodejs'],
};

const writer = {
  _id: 'patrick-writer-object-id',
  name: 'Patrick Chiu',
  latestArticlesAt: '2023-01-01T12:15:00.000Z',
};
```

##### 1. insertOne

Let’s say we have scraped an article and would like to insert the document to `articles`.

```javascript
const result = await db
  .collection('articles')
  .insertOne({
    writerId: 'patrick-writer-object-id',
    title: 'Introducing mongo-http.js',
    tags: [
      'javascript',
      'mongodb',
      'serverless',
      'nodejs',
      'cloudflare-workers',
    ],
  });

// If the insertion is successful
// => isSuccess: true, insertedId: 'object-id'
const { isSuccess, insertedId } = result;
```

##### 2. find

Then, we develop an endpoint `/articles` that supports the users to search by `tags`. Here, I use [hono.js](https://honojs.dev/) as the web framework.

```javascript
import { Hono } from 'hono';
const app = new Hono();

// For illustration purpose,
// I skip a lot of details, such as error handling
app.get('/v1/articles', async (c) => {
  const { tags = '' } = c.req.query();

  if (tags === '') {
    return c.json({ articles: [] });
  }

  const tagArray = tags
    .split(',')
    .slice(0, 10)
    .map((tag) => tag.trim());

  const result = db
    .collection('articles')
    .find({ filter: { tags: { $in: tagArray } } });

  const { isSuccess, documents } = result;
  return c.json({ articles: documents || [] });
});
```

##### 3. updateOne

Apart from scrapping articles, we also want to update the `latestArticlesAt` of a user.

```javascript
const result = db
  .collection('writers')
  .updateOne({
    filter: { writerId: 'patrick-writer-object-id' },
    update: { latestArticlesAt: '2023-01-04T19:30:00.000Z' },
  });

// If the update is successful
// => isSuccess: true, matchedCount: 1, modifiedCount: 1
// Since it is an existing document, upsertedId will be nil
const { isSuccess, matchedCount, modifiedCount, upsertedId } = result;
```

##### 4. deleteOne

If the user removes their Medium account, we want to delete the document from user.

```javascript
const result = await db
  .collection('writers')
  .deleteOne({ filter: { writerId: 'non-existing-writer-object-id' } });

// If the delete is successful
// => isSuccess: true, deletedCount: 1
const { isSuccess, deletedCount } = result;
```

#### Conclusion

In future articles, I hope to demonstrate full examples of using mongo-http with different web frameworks (e.g., [hono.js](https://honojs.dev/) and [itty](https://github.com/kwhitley/itty-router)) in different serverless runtimes (e.g., [Cloudflare Workers](https://workers.cloudflare.com/), [Digital Ocean functions](https://www.digitalocean.com/products/functions), and [Deno Deploy](https://deno.com/deploy))
