---
layout: '../../layouts/BlogLayout.astro'
title: '“Write Components Once, Compile to Every Framework” With Mitosis'
subtitle: What I learned while creating a GitHub Activity Calendar with Mitosis, which generates React, Vue, Svelte, and other components
date: 2023/04/14
tags: ['Mitosis', 'React', 'Vue', 'Svelte', 'GitHub Activity Calendar']
heroImagePath: '/images/blog/write-components-once-compile-to-every-framework-with-mitosis/hero.gif'
---

> TL;DR Here is the [Git repo](https://github.com/patrick-kw-chiu/activity-calendar-widget) and [npm package](https://www.npmjs.com/package/activity-calendar-widget) you can used instantly with `npm i activity-calendar-widget`. See more for usage with React (doc | [demo](https://stackblitz.com/edit/react-ts-pjkx7k?file=App.tsx)), Vue (doc | [demo](https://stackblitz.com/edit/vue-at6pyy?file=src%2FApp.vue)), Svelte (doc | [demo](https://stackblitz.com/edit/vitejs-vite-r7rxjt?file=src%2FApp.svelte&terminal=dev)), Solid (doc | [demo](https://stackblitz.com/edit/solidjs-templates-mjote1?file=src%2FApp.jsx)) and Qwik (doc | [demo](https://stackblitz.com/edit/qwik-starter-due4dq?file=src%2Froot.tsx)).

#### Preface

![mitosis](/images/blog/write-components-once-compile-to-every-framework-with-mitosis/mitosis.webp)

Recently, I’ve been researching how to create a UI library that can be used in various modern frontend frameworks, e.g., React, Vue, and Svelte. I came across [Mitosis](https://github.com/BuilderIO/mitosis) from [Builder.io](https://www.builder.io/) and tried to create a complex enough GitHub Activity Calendar widget as a [POC](https://en.wikipedia.org/wiki/Proof_of_concept). Though there are some hiccups, overall, it is a good experience. I want to take this chance to journal the process and my learnings. Why create a calendar widget? Because it helps to demonstrate some key functionalities:

1. Able to accept inputs (Parent to Child), e.g., passing `data` and render the activity stat accordingly
2. Able to execute callbacks on events (Child to Parent), e.g., `onClick` and notify the parent which day box is being clicked
3. Able to customize the theme, e.g., customize the date box from green to purple by [CSS variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) instead of inline passing a `color` props

#### Building a _Simplified_ Activity Calendar

##### 1. Outline the design

![github activity calendar design outline](/images/blog/write-components-once-compile-to-every-framework-with-mitosis/github-activity-calendar-design-outline.webp)

There are much more components and logic in the published components. However, to simplify this walkthrough, we will only create two main Mitosis components `<Day />` and `<ActivityCalendar />`.

`<ActivityCalendar />` is our entry point, which accepts a data array prop specifying each day’s activities. Regardless of whether there are activities, a `<Day />` component will be rendered for each day.

```
.
├── preview
├── src/
│   ├── ActivityCalendar.lite.jsx
│   └── Day.lite.jsx
├── mitosis.config.js
└── package.json
```

The `src` directory stores our Mitosis components.

The `output` directory stores the generated components of the target frameworks. It can be customized in `mitosis.config.js`.
The `mitosis.config.js` file will be explained in step 3.

##### 2. Initiate NPM and [Install Mitosis](https://github.com/BuilderIO/mitosis#install)

```
npm init -y
npm install @builder.io/mitosis-cli @builder.io/mitosis
```

##### 3. Set up `mitosis.config.js`

```javascript
/** @type {import('@builder.io/mitosis').MitosisConfig} */
module.exports = {
  files: 'src/**',
  targets: ['vue3', 'solid', 'svelte', 'react', 'qwik'],
  dest: 'preview',
};
```

This is the Mitosis config JS file (You don’t say 😅). We can edit `targets` to add/remove framework components to generate, e.g., `preact`. Here’s Mitosis [configuration doc](https://github.com/BuilderIO/mitosis/blob/main/docs/configuration.md#mitosis-configuration), which contains all the available frameworks but does notice that some frameworks are in a very early stage (in fact, Mitosis itself is still in beta).

##### 4. Set up the dev server?

Sadly, Mitosis doesn’t come with a Dev Server yet. In this walkthrough, you can try it out in [Replit](https://replit.com/@PatrickChiu/Mitosis-Activity-Calendar-Simplified) (edit the Mitosis components and generate native components) and preview the generated (e.g., React.js) components in [Stackblitz](https://stackblitz.com/edit/react-nsex68).

In my local environment, I set up Astro to render multiple generated components on the same page. I will leave this to the next article.

##### 5. `<Day />` component

> Here is the `<Day />` [source code](https://replit.com/@PatrickChiu/Mitosis-Activity-Calendar-Simplified#src/Day.lite.jsx).

```javascript
export default function Day(props) {
  return (
    <div
      onClick={() => props.handleDayClick(props.dt)}
      style={{
        position: 'absolute',
        width: '10px',
        height: '10px',
        backgroundColor: 'var(--day-box-color, #39d353)',
        borderRadius: '2px',
        top: props.top,
        right: props.right,
        opacity: props.opacity,
      }}
    ></div>
  );
}
```

`<Day />` is a simple component that renders a rounded corner square 🟩, which is the day box in the activity calendar. Its position is determined by `props.top` and `props.right`. While the box color (how light the box is) is determined by `props.opacity`. When clicked, the `props.handleDayClick` function will be called with `props.dt`, which contains the box’s date and time data.

##### 6. `<ActivityCalendar />` component

> Here is the `<ActivityCalendar />` [source code](https://replit.com/@PatrickChiu/Mitosis-Activity-Calendar-Simplified#src/ActivityCalendar.lite.jsx).

```javascript
import { For } from '@builder.io/mitosis';

import Day from './Day.lite';

const getDays = (props) => {
  // Generate 180 days from today
  // Merge with the activities of specified days
  const dataObj = (props.data || []).reduce((acc, cur) => {
    return { ...acc, [cur.date]: cur.activities };
  }, {});

  return new Array(180).fill(0).map((_, index) => {
    const dt = new Date();
    dt.setDate(dt.getDate() - index);
    const year = dt.getFullYear();
    const month = dt.getMonth() + 1;
    const day = dt.getDate();
    const id = year + '-' + month + '-' + day;

    return {
      id,
      year,
      month,
      day,
      dayOfWeek: dt.getDay(),
      dayDiffFromToday: index,
      activities: dataObj[id] || [],
    };
  });
};

const getDayRight = ({ dayDiffFromToday = 0, dayOfWeek = 0 }) => {
  const todayDayOfWeek = new Date().getDay();

  return (
    (Math.floor(dayDiffFromToday / 7) + (dayOfWeek > todayDayOfWeek ? 1 : 0)) *
    14
  );
};

export default function ActivityCalendar(props) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
        width: Math.ceil(180 / 7) * 14 + 'px',
        height: 7 * 14 + 'px',
      }}
    >
      <For
        each={getDays({
          data: props.data ?? [],
          weekStart: props.weekStart,
          daysToRender: props.daysToRender,
        })}
      >
        {(dt, index) => (
          <Day
            key={index}
            handleDayClick={props.handleDayClick}
            dt={dt}
            opacity={(dt.activities.length + 1) / 10 + ''}
            top={dt.dayOfWeek * 14 + 'px'}
            right={
              getDayRight({
                dayDiffFromToday: dt.dayDiffFromToday,
                dayOfWeek: dt.dayOfWeek,
              }) + 'px'
            }
          />
        )}
      </For>
    </div>
  );
}
```

The `getDays` function generates an array with 180-day objects (180 is an arbitrary hard-coded value). If there are `activities` on the specified date in `props.data`, it will be merged to that specified day object. Regardless of whether there are activities, there will be a day object for each date, which will then render the `<Day />`s.

In the `<ActivityCalendar />` component, `<For each={getDays()}> … </For>`, which is a [Mitosis API](https://github.com/BuilderIO/mitosis/blob/main/docs/components.md#for), is used to render each of the `<Day />`s. The `props` that `<Day />` needs are passed in a very similar React.js fashion.

Here is what `props.data` looks like. There are activities on 2023–4–1 and 2023–3–26:

```json
[
  {
    "date": "2023-4-1",
    "activities": [
      { "title": "commit code" },
      { "title": "review pr" },
      { "title": "open issue" },
      { "title": "commit code" }
    ],
  },
  {
    "date": "2023-3-26",
    "activities": [{}, {}, {}, {}, {}, {}, {}, {}],
  }
];
```

##### 7. Generate the target components!

Now, the exciting moment! Let’s generate the target components by using the `npm exec mitosis build` command. Since we specify our `targets` frameworks as `['react', 'svelte', 'vue3', 'solid', 'qwik]` in `mitosis.config.js`. The following screenshot is what we can expect:

![npm exec mitosis build](/images/blog/write-components-once-compile-to-every-framework-with-mitosis/npm-exec-mitosis-build.webp)

##### 8. See what it looks like in [Vue](https://replit.com/@PatrickChiu/Mitosis-Activity-Calendar-Simplified#preview/vue/vue3/src/ActivityCalendar.vue) and try out the onClick handler handleDayClick

```html
<template>
  <div
    :style="{
      position: 'relative',
      display: 'inline-block',
      width: Math.ceil(180 / 7) * 14 + 'px',
      height: 7 * 14 + 'px',
    }"
  >
    <template
      :key="index"
      v-for="(dt, index) in getDays({
        data: data ?? [],
        weekStart: weekStart,
        daysToRender: daysToRender,
      })"
    >
      <day
        :handleDayClick="handleDayClick"
        :dt="dt"
        :opacity="(dt.activities.length + 1) / 10 + ''"
        :top="dt.dayOfWeek * 14 + 'px'"
        :right="
          getDayRight({
            dayDiffFromToday: dt.dayDiffFromToday,
            dayOfWeek: dt.dayOfWeek,
          }) + 'px'
        "
      ></day>
    </template>
  </div>
</template>

<script>
  import Day from './Day.vue';
  const getDays = (props) => {
    const dataObj = (props.data || []).reduce((acc, cur) => {
      return { ...acc, [cur.date]: cur.activities };
    }, {});
    return new Array(180).fill(0).map((_, index) => {
      const dt = new Date();
      dt.setDate(dt.getDate() - index);
      const year = dt.getFullYear();
      const month = dt.getMonth() + 1;
      const day = dt.getDate();
      const id = year + '-' + month + '-' + day;
      return {
        id,
        year,
        month,
        day,
        dayOfWeek: dt.getDay(),
        dayDiffFromToday: index,
        activities: dataObj[id] || [],
      };
    });
  };
  const getDayRight = ({ dayDiffFromToday = 0, dayOfWeek = 0 }) => {
    const todayDayOfWeek = new Date().getDay();
    return (
      (Math.floor(dayDiffFromToday / 7) +
        (dayOfWeek > todayDayOfWeek ? 1 : 0)) *
      14
    );
  };

  export default {
    name: 'activity-calendar',
    components: { Day: Day },
    props: ['data', 'weekStart', 'daysToRender', 'handleDayClick'],

    methods: { getDays, getDayRight },
  };
</script>
```

… And [React](https://replit.com/@PatrickChiu/Mitosis-Activity-Calendar-Simplified#preview/react/src/ActivityCalendar.jsx), [Svelte](https://replit.com/@PatrickChiu/Mitosis-Activity-Calendar-Simplified#preview/svelte/src/ActivityCalendar.svelte), [Solid](https://replit.com/@PatrickChiu/Mitosis-Activity-Calendar-Simplified#preview/solid/src/ActivityCalendar.jsx) and [Qwik](https://replit.com/@PatrickChiu/Mitosis-Activity-Calendar-Simplified#preview/qwik/src/ActivityCalendar.jsx). Not bad, huh? Let’s try passing a `onClick` handler called `handleDayClick`.

```html
<ActivityCalendar
  :daysToRender="150"
  :data="data"
  :handleDayClick="handleDayClick"
/>

<script>
  export default {
    name: 'App',
    data() {
      return {
        data: [ ... ]
      };
    },
    methods: {
      handleDayClick: (dt) => {
        console.log(dt);
      },
    },
  };
</script>
```

Click the day box and see the result!

![handle day click result](/images/blog/write-components-once-compile-to-every-framework-with-mitosis/handle-day-click-result.webp)

##### 9. Customize the color theme

Lastly, let’s customize the box color by [CSS variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) instead of inline passing the `color` props. Indeed, theming by CSS variables is only one of the ways, and every framework has its own native way of doing theming. Mitosis might not be able to support the specific native theming, but it is good to know that Mitosis can them by CSS variables.

In another [React.js demo](https://stackblitz.com/edit/react-nsex68?file=src%2FApp.js%2Csrc%2Fstyle.css), let’s try to add the following line to `src/style.css`.

```css
:root {
  --day-box-color: teal;
}
```

And here’s what the teal-ish Activity Widget looks like!

![teal-ish Activity Widget](/images/blog/write-components-once-compile-to-every-framework-with-mitosis/tealish-activity-widget.webp)

#### What I Learned

##### You might need to code in a “Mitosis” way

Mitosis is great and works fine most of the time, but it does come with [limitations](https://github.com/BuilderIO/mitosis/blob/main/docs/gotchas.md) that restrict us from writing in a more declarative “Mitosis” way. Sometimes, I code something in a common React way, e.g., computing the default state value with props and finding out that [it is not allowed](https://github.com/BuilderIO/mitosis/blob/main/packages/eslint-plugin/docs/rules/no-assign-props-to-state.md). In addition, their [ES Lint plugin](https://github.com/BuilderIO/mitosis/tree/main/packages/eslint-plugin) is a great “reminder” of these constraints. Altogether, it should catch most of the errors.

##### Try extracting the logic into framework-agnostic pure functions

The restrictions are significantly lower if the logic isn’t placed inside a Mitosis functional component and is (mostly) pure. For instance, I’m allowed to destructure objects ([Mitosis seems to](https://github.com/BuilderIO/mitosis/blob/main/docs/gotchas.md#cant-destructure-props-as-rest) [hate](https://github.com/BuilderIO/mitosis/blob/main/docs/gotchas.md#cant-destructure-assignment-from-state) [destructuring](https://github.com/BuilderIO/mitosis/blob/main/docs/gotchas.md#cant-set-default-props-value-with-destructuring) 🫠 jk jk) and [have comments inside](https://github.com/BuilderIO/mitosis/issues/250), like how I normally did in React.js. Also, when I inspect the generated components of React.js or other frameworks, those functions are almost a 1-to-1 match.

##### Use [‘css’](https://github.com/BuilderIO/mitosis/blob/main/docs/components.md#css) for static styling and ‘style’ for dynamic styling

While `css` is the [suggested way of styling](https://github.com/BuilderIO/mitosis/blob/main/docs/components.md#css), it seems impossible to use variables there. There is another way - the `style` props - of styling an element in Mitosis. If the styling is static (won’t be changed corresponding to variables), use `css` which will generate a CSS class or styled component in the target framework components.

Use `style` if you need to determine the styling value by variable, e.g., the opacity of the `<Day />` box 🟩, which will generate an inline style attribute to the HTML element.

You can also place a CSS [`class`](https://github.com/BuilderIO/mitosis/blob/main/docs/components.md#class-vs-classname) to the component and provide CSS file(s) for the users to `import`. In addition, you can [`useStyle`](https://github.com/BuilderIO/mitosis/blob/main/docs/hooks.md#usestyle) to style the component, which I haven’t played around with this option yet.

##### Avoid naming the function props as event listeners like on”Event,” e.g., onClick

When naming the function props as event listeners like `on"Event"`, e.g., `onClick` and generating components for Svelte, it will be transformed to `on:click`. How about naming it as non-standard events like onDayClick? Currently, it is also generated to `on:dayClick`. To avoid this issue, try something like `handleDayClick` at this moment.

#### Epilogue

Overall, the experience of using [Mitosis](https://github.com/BuilderIO/mitosis/) is similar to React.js, with a few hiccups. For example, I must constantly check whether the generated components break in certain frameworks. However, once I got used to the limitations, I would say [Mitosis](https://github.com/BuilderIO/mitosis/) is a great tool to work with, especially when you want to build slightly more complex components than just a themed button or nav bar, which targets multiple frameworks.

I noticed that the [communication between different frameworks and Web Components is improving](https://custom-elements-everywhere.com/) nowadays, except React.js. Building a POC with Web Components is definitely on my radar. Follow and connect with me for more interesting projects!
