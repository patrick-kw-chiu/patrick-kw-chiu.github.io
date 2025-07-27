---
layout: '../../layouts/BlogLayout.astro'
title: 'Mitosis - Using Astro.js as the dev server to preview the component with hot-reload'
subtitle:
date: 2023/08/31
tags:
  [
    'Mitosis',
    'Astro.js',
    'dev server',
    'hot-reload',
    'preview',
    'react',
    'svelte',
  ]
heroImagePath: '/images/blog/mitosis-using-astrojs-as-the-dev-server-to-preview-the-component-with-hot-reload/hero.webp'
---

1. [What is Mitosis](#quick-refresher-of-what-mitosis-is)
2. [Astro.js as the dev server](#astrojs-as-the-dev-server)
3. [Steps](#steps)

- [Set up Mitosis](#1-set-up-mitosis)
- [Set up Astro.js in `/test-app`](#2-set-up-astrojs-in-raw-testapp-endraw-)
  - [Framework integrations](#21-framework-integrations)
  - [Astro.js folder structure](#22-astrojs-folder-structure)
- [Update the build script](#3-update-the-build-script)
- [(Bonus) .gitignore](#4-bonus-gitignore)
- [(Bonus) Settings of Publishing to NPM](#5-bonus-settings-of-publishing-to-npm)

![Mitosis + Astro.js](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/23ucq3cdvu8kgqcvjfi5.png)

> TL;DR Here's the [Mitosis Astro.js Starter repo](https://github.com/patrick-kw-chiu/mitosis-astrojs-starter/) to jump start the development. I built a [GitHub Activity Widget](https://github.com/patrick-kw-chiu/activity-calendar-widget) component with a similar setup, which compiles to native [React](https://react.dev/), [Svelte](https://svelte.dev/), [Vue](https://vuejs.org/), [SolidJS](https://www.solidjs.com/) and [Qwik](https://qwik.dev/) components.

## What is Mitosis

In case you are new to [Mitosis](https://mitosis.builder.io/), Mitosis enables you to develop a consistent design system across multiple frameworks e.g. [React](https://react.dev/), [Svelte](https://svelte.dev/) and [Vue](https://vuejs.org/).

Its syntax is pretty similar to [React](https://react.dev/). It allows you to write your component in JSX and transforms into native components of the various frameworks.

## Astro.js as the dev server

While Mitosis is great at generating framework-native components, it doesn't come with a dev server to let you preview the component. You may ask, why do we want to preview the component in various frameworks, instead of only previewing it in one of them e.g. svelte?

Turns out there are quite a few of [gotchas](https://mitosis.builder.io/docs/gotchas/) and open [issues](https://github.com/BuilderIO/mitosis/issues) in using Mitosis (when this tutorial is written). Sometimes the generated code works perfectly in React and Vue _but not Svelte_. Sometimes the others. It would be great if

- We could preview most (if not all) generated components in a single page
- Even better, have **hot-reload** enabled

In this tutorial, we will walk through the steps to set up a hot-reload dev server with [Astro.js](https://astro.build/).

> Note: Astro supports a variety of popular frameworks including [React](https://react.dev/), [Preact](https://preactjs.com/), [Svelte](https://svelte.dev/), [Vue](https://vuejs.org/), [SolidJS](https://www.solidjs.com/), [AlpineJS](https://alpinejs.dev/) and [Lit](https://lit.dev/) with official integrations. While for other frameworks e.g. [Angular](https://angular.dev/) and [Qwik](https://qwik.dev/), you may still benefit from this tutorial and you would need to further set up the [community maintained framework integrations](https://astro.build/integrations/?search=&categories%5B%5D=frameworks).

![Mitosis generating framework native components](https://dev-to-uploads.s3.amazonaws.com/uploads/articles/0i623tggv6ky7fw7ix3l.png)

## Steps

### 1. Set up Mitosis

This step references the official [Create a new project](https://mitosis.builder.io/docs/quickstart/#create-a-new-project) cli guide with the following modifications.

- We aren't initializing `test-apps` for each framework. Instead, we would run one `test-app` with Astro.js for all frameworks.
- In terms of NPM package, we aren't scoping the component under a namespace and output **various** packages like `@my-awesome-component/library-react` and `@my-awesome-component/library-svelte` etc. Instead, we publish all components in **one** package only `my-awesome-component`. The output components can then be imported like `my-awesome-component/react` and `my-awesome-component/svelte` etc

The folder structure should look like this by the end of this step.

```
.
├── src/
│   └── MyAwesomeComponent.lite.tsx
├── mitosis.config.cjs
├── package.json
└── tsconfig.json
```

Without further ado, let's initiate an empty project.

```
mkdir my-awesome-component
cd ./my-awesome-component
npm init -y
```

Install the relevant packages

```
npm i @builder.io/eslint-plugin-mitosis @builder.io/mitosis @builder.io/mitosis-cli
npm i watch --save-dev
```

Setup `mitosis.config.cjs`. In the `targets` field, place all downstream frameworks to compile.

```javascript
/**
 * @type {import('@builder.io/mitosis').MitosisConfig}
 */
module.exports = {
  files: 'src/**',
  targets: ['react', 'svelte', 'solid', 'vue'],
  dest: 'output',
  commonOptions: { typescript: true },
  options: { react: { stylesType: 'style-tag' }, svelte: {}, qwik: {} },
};
```

Setup `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "strict": true,
    "jsx": "preserve",
    "noImplicitAny": false,
    "moduleResolution": "node",
    "jsxImportSource": "@builder.io/mitosis"
  },
  "include": ["src"]
}
```

Initialize `src/MyAwesomeComponent.lite.tsx`

```jsx
import { useState } from '@builder.io/mitosis';

export default function MyComponent(props) {
  const [name, setName] = useState('Steve');

  return (
    <div>
      <input
        css={{ color: 'red' }}
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      Hello! I can run natively in React, Vue, Svelte, Qwik, and many more
      frameworks!
    </div>
  );
}
```

### 2. Set up Astro.js in `/test-app`

The folder structure should look like this by the end of this step. We will focus on `test-app`

```
.
├── src/
│   └── MyAwesomeComponent.lite.tsx
├── test-app/
│   └── astro.config.mjs
├── mitosis.config.js
├── package.json
└── tsconfig.json
```

Create astro project with the following config

```
npm create astro@latest
```

```
# Where should we create your new project?
./test-app

# How would you like to start your new project?
Empty

# Do you plan to write TypeScript?
Yes

# How strict should TypeScript be?
Strict

# Install dependencies?
Yes

# Initialize a new git repository?
No
```

Cd into the directory

```
cd test-app
```

#### 2.1. Framework integrations

Follow the [official integration guide](https://docs.astro.build/en/guides/integrations-guide/) to add React.js, Vue, Svelte and Solid.js. (You can add more if you need)

```
npx astro add react
npx astro add vue
npx astro add svelte
npx astro add solid
```

Since both React.js and Solid.s uses JSX, we need to let Astro.js where to find both correspondingly. Update `astro.config.mjs` with the following settings.

```javascript
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import solid from '@astrojs/solid-js';
import svelte from '@astrojs/svelte';
import vue from '@astrojs/vue';

export default defineConfig({
  integrations: [
    react({ include: ['**/react/**'] }),
    solid({ include: ['**/solid/**'] }),
    svelte(),
    vue(),
  ],
});
```

#### 2.2. Astro.js folder structure

Let's structure our Astro.js `test-app` like the following and import all components to `index.astro`.

```
.
├── test-app/
│   ├── src/
│   │   ├── components/
│   │   │   ├── react/
│   │   │   │   └── ReactApp.tsx
│   │   │   ├── solid/
│   │   │   │   └── SolidApp.tsx
│   │   │   ├── SvelteApp.svelte
│   │   │   └── VueApp.vue
│   │   └── pages/
│   │       └── index.astro
│   └── astro.config.mjs
```

See the GitHub repo for content in [ReactApp.tsx](https://github.com/patrick-kw-chiu/mitosis-astrojs-starter/blob/master/test-app/src/components/react/ReactApp.tsx), [SvelteApp.svelte](https://github.com/patrick-kw-chiu/mitosis-astrojs-starter/blob/master/test-app/src/components/SvelteApp.svelte), [VueApp.vue](https://github.com/patrick-kw-chiu/mitosis-astrojs-starter/blob/master/test-app/src/components/VueApp.vue) and [SolidApp.tsx](https://github.com/patrick-kw-chiu/mitosis-astrojs-starter/blob/master/test-app/src/components/solid/SolidApp.tsx).

For `index.astro`, replace with the following. This wires up various framework components into a single Astro.js page.

```svelte
---
import ReactApp from '../components/react/ReactApp.jsx'
import SvelteApp from '../components/SvelteApp.svelte'
import VueApp from '../components/VueApp.vue'
import SolidApp from '../components/solid/SolidApp.jsx'
---

<html lang="en">
  <head>
    <meta charset="utf8" />
    <title>Test App</title>
  </head>

  <body>
    <div class="w-50">
      <div class="title">
        <span>React</span>
      </div>
      <ReactApp client:only="react" />
    </div>
    <div class="w-50">
      <div class="title">
        <span>Svelte</span>
      </div>
      <SvelteApp client:load />
    </div>
    <div class="w-50">
      <div class="title">
        <span>Vue</span>
      </div>
      <VueApp client:only="vue" />
    </div>
    <div class="w-50">
      <div class="title">
        <span>Solid</span>
      </div>
      <SolidApp client:only="solid-js" />
    </div>
  </body>
</html>

<style>
  body {
    background-color: aliceblue;
  }

  .w-50 {
    display: inline-block;
    width: calc(48% - 12px * 2 - 8px * 2);
    margin: 8px;
    padding: 12px;
    border-radius: 8px;
    box-shadow: 0px 1px 4px rgba(0, 0, 0, 0.1);
    background-color: white;
  }

  .title {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 8px;
  }
</style>
```

### 3. Update the build script

Now let's wire up Mitosis and Astro.js! Update the root `package.json` with the following.

- `npm run build`: Mitosis generates downstream components to `./output` and we copy it to `./test-app/src`
- `npm run start`: we `watch` changes in `./src` and `npm run build` when there are changes

```json
{
  // ...
  "scripts": {
    "start": "watch \"npm run build\" ./src",
    "build": "mitosis build --c mitosis.config.cjs && cp -R ./output ./test-app/src",
    "lint": "eslint"
  }
  // ...
}
```

### 4. (Bonus) .gitignore

Mitosis build script would compile the downstream component to `./output`. Let's ignore it together with `./node_modules` and Astro.js' generated types

```.gitignore
# dependencies
node_modules/

# Mitosis
output/

# Astro.js
.astro/
```

### 5. (Bonus) Settings of Publishing to NPM

Now you have built an awesome Mitosis component. Let's update `package.json` so that developers of various frameworks can use your component!

**_(Don't forget to change the actual package name from `my-awesome-component` to something else!)_**

```json
{
  "name": "my-awesome-component",
  // ...
  "main": "./output/react/src/MyAwesomeComponent.tsx",
  "exports": {
    "./react": "./output/react/src/MyAwesomeComponent.tsx",
    "./svelte": "./output/svelte/src/MyAwesomeComponent.svelte",
    "./vue": "./output/vue/src/MyAwesomeComponent.vue",
    "./solid": "./output/solid/src/MyAwesomeComponent.tsx"
  },
  "files": ["output/**/*"]
}
```

The above settings do 2 things

1. You only publish the generated downstream components in the `./output` directory to NPM
2. Your component can be imported with...

```js
// React
import MyAwesomeComponent from 'my-awesome-component/react';

// Vue
import MyAwesomeComponent from 'my-awesome-component/vue';

// Svelte
import MyAwesomeComponent from 'my-awesome-component/svelte';

// Solid
import MyAwesomeComponent from 'my-awesome-component/solid';
```

Hope you enjoy the journey of setting up Mitosis with Astro.js which enables you to preview all the generated components at a glance! Lastly, do you need a quick walkthrough on creating a Mitosis component? Here's [how to develop the Github Activity Calendar with Mitosis](https://betterprogramming.pub/write-components-once-compile-to-every-framework-with-mitosis-9330411d21e4) 😉
