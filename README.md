# SMX Config - Web Edition

## Introduction

This is a work-in-progress config tool for StepManiaX stages that runs in a web browser. It can read debug values from individual sensors and perform a factory reset on a stage. It currently _cannot_ write configuration (sensitivity levels, GIFs, etc) to the stage, yet.

Connect your stage to a desktop/laptop computer, and visit [smx.tools](https://smx.tools/) in Google Chrome, Microsoft Edge, Brave, Vivaldi, etc.

Our tech stack uses [WebHID](https://developer.chrome.com/docs/capabilities/web-apis/hid-examples) (Chrome-only at the moment) to communicate with the stages. React is used for the UI.

## Developing

Recommend you install [mise](https://mise.jdx.dev/) to manage your NodeJS install.

### First time setup

Install the [Biome linter/formatter extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) in VS Code.

```
# set up nodejs
$ mise install

# install yarn
$ npm i -g yarn
```

### Day-to-day dev work

```
# install/update local copies of npm dependencies
$ yarn install

# start the local live-reloading dev server
$ yarn start

# apply all auto-fixes to formatting, style, etc
$ yarn lint --apply
```

### Credit

This project is heavily based on [pySMX](https://github.com/fchorney/pySMX) which is heavily based on the original [StepManiaX SDK](https://github.com/steprevolution/stepmaniax-sdk).
