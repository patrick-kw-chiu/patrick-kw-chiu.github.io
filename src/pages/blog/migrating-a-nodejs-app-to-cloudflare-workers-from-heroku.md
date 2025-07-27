---
layout: '../../layouts/BlogLayout.astro'
title: 'Migrating a Node.js App to Cloudflare Workers from Heroku'
subtitle: Redesigning a Node.js/MongoDB app for Cloudflare Workers and the things I wasn’t aware of at the beginning
date: 2022/10/14
tags: ['Node.js', 'Cloudflare', 'Workers', 'MongoDB', 'Heroku']
heroImagePath: '/images/blog/migrating-a-nodejs-app-to-cloudflare-workers-from-heroku/hero.webp'
---

> Note: [Cloudflare Workers](https://www.cloudflare.com/products/workers/) is definitely not a direct alternative to Heroku. If we want minimal adjustment on the Node.js app, [Google Cloud App Engine](https://cloud.google.com/appengine) might be a better choice.

#### Introduction

For a very long time, Heroku has been my default choice for hosting my side projects due to its convenience and ease of use. Sadly, [Heroku will discontinue its free product plans](https://blog.heroku.com/next-chapter) soon. This post is to journal my experience of migrating one of my side projects - [Medium Rare](https://medium-rare.vercel.app/) to [Cloudflare Workers](https://www.cloudflare.com/products/workers/) 👷🏻.

> [Medium Rare](https://medium-rare.vercel.app/) is a web app, which indexes and distributes Chinese articles on the Medium platform. Currently it only supports Chinese language. My motivation comes from the fact that, Medium only primarily supports English articles, while the distribution of non-English articles is, well, little to none.

The Medium Rare backend is pretty simple. It only has 3 endpoints. And it is connecting to a MongoDB.

```
1. GET /articles
2. GET /writers
3. POST /articles/read
```

Let’s use `GET /articles` as an example.

---

#### Redesigning the App

There are 2 areas — routing and database connection, which need to be adjusted in order to fit our app to Cloudflare Workers.

##### 1. Routing

```javascript
const express = require('express');
const app = express();
const port = 3000;

app.get('/articles', async (req, res) => {
  // 1. Some magical step to formulate the query
  const query = formulateQuery(req);

  // 2. Query the database
  const articles = await db.collection('articles').find(query).toArray();

  // 3. Return the articles
  return res.json({ articles });
});

app.listen(port, () => {
  console.log(`MR running on port ${port}`);
});
```

Above is a demo `GET /articles API` written in Express.js. Here is what it looks like if we would like to achieve something similar in CF Workers:

```javascript
export default {
  async fetch(request, env, context) {
    const { pathname } = new URL(request.url);

    // 1. Match the route by ourselves
    if (request.method === 'GET' && pathname.startsWith('/articles')) {
      // 2. Some magical steps
      const articles = await someMagicalSteps();

      // 3. Return the articles
      const json = JSON.stringify(articles, null, 2);
      return new Response(json, {
        headers: { 'content-type': 'application/json;charset=UTF-8' },
      });
    }
  },
};
```

It doesn’t seem to be developer-friendly to use the native CF Workers [fetch event](https://developers.cloudflare.com/workers/runtime-apis/fetch-event/) runtime API. Luckily, there are a few routing libraries supporting CF Workers e.g. [itty-router](https://www.npmjs.com/package/itty-router) and [Hono](https://honojs.dev/). I find myself leaning towards Hono, and here is what it looks like:

```javascript
import { Hono } from 'hono';

const app = new Hono();

app.get('/articles', async (context) => {
  // 1. Some magical step to formulate the query
  const query = formulateQuery(context.req);

  // 2. Query the database, which will be discussed in Section 2
  const articles = await getArticlesFromDb(query);

  // 3. Return the articles
  return context.json({ articles });
});

export default app;
```

Noice! It feels like home!

##### 2. Database connection

When we are using CF Workers, we cannot directly connect to our MongoDB with the driver. Instead, [CF Workers’ strategy is to support Databases that can connect over HTTP](https://blog.cloudflare.com/workers-adds-support-for-two-modern-data-platforms-mongodb-atlas-and-prisma/) and MongoDB now offers Data API which lets you [read or write data with standard HTTPS requests](https://www.mongodb.com/docs/atlas/api/data-api/)!

> By the way, I created [mongo-http.js](https://github.com/patrick-kw-chiu/mongo-http.js) - a thin wrapper on [Mongodb Atlas Data API](https://www.mongodb.com/docs/atlas/api/data-api/), which provides similar API as the [Mongodb Node.js Driver](https://www.npmjs.com/package/mongodb).

Back to our original database query, it could look something like this:

```javascript
const articles = await db
  .collection('articles')
  .find({ tags: { $in: ['cloudflare', 'heroku', 'nodejs'] } })
  .toArray();
```

When we use MongoDB Data API, it would be something like this:

```javascript
const payload = {
  collection: 'articles',
  database: 'medium',
  dataSource: 'Cluster0',
  filter: { tags: { $in: ['cloudflare', 'heroku', 'nodejs'] } },
};

const response = await fetch(env.MONGODB_URL + '/action/find', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'api-key': env.MONGODB_API_KEY,
  },
  body: JSON.stringify(payload),
});

const articles = await response.json().documents;
```

---

#### Things I wasn’t aware of

1. **Environment variable is [passed along the context/request](https://developers.cloudflare.com/workers/runtime-apis/fetch-event/#parameters), instead of getting from `process.env`** — In the Database connection section above, we use `MONGODB_URL` and `MONGODB_API_KEY` to make an HTTPS request to MongoDB Data API. If native [fetch event](https://developers.cloudflare.com/workers/runtime-apis/fetch-event/) runtime API is used, it would be in the parameters

```javascript
export default {
  fetch(request, env, context) {
    //
  },
};
```

In Hono, `env` is inside the `context` parameter

```javascript
app.get('/articles', (context) => {
  const { env } = context;
});
```

2. **Updates of Environment variables in `wrangler.toml` needs to be `wrangler publish` to be in effect** — I originally thought `wrangler dev` is grabbing environment variables from `wrangler.toml`. It looks like it is grabbing from the actual CF Workers in the cloud instead. This also leads to #3.

3. **`wrangler dev` is also using your requests quota** — Turns out that if we want fully local development, we should be using [Miniflare](https://github.com/cloudflare/miniflare). This also leads to #4 (the last one).

4. **If you `wrangler publish` more than 1 environment, each of the API calls to the “local” server is going to use 1 request from every environment** — For example, if you have `wrangler publish`ed 3 environments `api-dev`, `api-staging` and `api-production`, and you spin up a “local” server with `wrangler dev`. And then you fire a request to the “local” server, it will use up 3 requests quota.

---

#### Epilogue

There are a few things I haven’t covered - debugging and logging. In short, the debugging experience is great, since CF Workers’ Devtools is using the browser’s Devtools. For logging, CF Workers has a [log-streaming dashboard](https://developers.cloudflare.com/workers/learning/logging-workers/#view-logs-from-the-dashboard) for real-time logs, while we need to “bring your own logging service” to persist logs.

It is overall a great developer experience developing on CF Workers. I’m looking forward to exploring more when I migrate more side projects to CF Workers!
