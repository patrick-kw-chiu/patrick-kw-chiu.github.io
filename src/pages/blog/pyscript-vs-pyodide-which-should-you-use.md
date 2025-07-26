---
layout: '../../layouts/BlogLayout.astro'
title: 'PyScript Vs. Pyodide: Which Should You Use?'
subtitle: Start with PyScript first if you are more of a Pythonic developer. Try Pyodide if you want to “Add some Python” to your JavaScript.
date: May 10, 2022
tags: ['PyScript', 'Pyodide', 'Python', 'JavaScript', 'WASM']
heroImagePath: '/images/blog/pyscript-vs-pyodide-which-should-you-use/hero.png'
navs:
  [
    { url: '/', title: 'Homepage', dotColor: 'typescript' },
    { url: '/blog', title: 'Blog', dotColor: 'angular' },
  ]
---

> Disclaimer: I created [SkyCube.app](https://skycube.app/) which is a Pyodide-powered ML tool that runs entirely in the browser. Also, my opinions (as of 2022/5/10) might be outdated soon, since I have full confidence that Anaconda will advance PyScript to the next level quickly :)

#### Usage and Aims

![pyscript](/images/blog/pyscript-vs-pyodide-which-should-you-use/pyscript.png)

PyScript [enables Python applications to leverage HTML, CSS, and JavaScript conventions](https://engineering.anaconda.com/), but not the other way round yet. What I mean is that you can call JavaScript functions/libraries from Python (PyScript), but you cannot call Python functions from JavaScript. It is understandable as Anaconda’s primary users are Python developers. In fact, one of the aims of PyScript is to [help Python take a serious step toward making programming and data science more accessible to everyone](https://www.anaconda.com/blog/pyscript-python-in-the-browser).

![pyodide](/images/blog/pyscript-vs-pyodide-which-should-you-use/pyodide.webp)

On the other hand, Pyodide [comes with a robust Javascript ⟺ Python foreign function interface](https://pyodide.org/en/stable/). You can run Python `pyodide.runPython("print(x)")` or even get a variable `pyodide.globals.get("sys")` from JavaScript. You can also `import js` and `js.document.title = "New window title"` from Python. After all, Pyodide let us [freely mix these two languages in your code with minimal friction](https://pyodide.org/en/stable/project/about.html).

#### The Bright Side of PyScript

##### Clean and Simple API

PyScript does provide a clean and simple API! For instance, you can `<py-script src="/todo.py"></py-script>` to load your Python script. You can even import your other Python script, just like how you normally do so! While in Pyodide, you need to handle the Python script yourself and manage to put it `pyodide.runPython(<here>)`. It is also a great convenience if we just want to output the result to an HTML element by `<py-script output="altair"></py-script>`, where altair is the id of an HTML element.
