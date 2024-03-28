# SMX Config - Web Edition

This is an early WIP for a web-based config tool for StepManiaX stages using WebHID for communication and React for the UI.

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
