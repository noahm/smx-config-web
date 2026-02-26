# SMX Web Config

## Introduction

This is a work-in-progress config tool for StepManiaX stages that runs in a web browser. It can read debug values from individual sensors, apply standard Low/Normal/High sensitivity presets, or perform a factory reset on a stage. It currently _cannot_ adjust advanced configuration (sensitivity levels per panel/sensor, GIFs, etc)... yet.

Connect your stage to a desktop/laptop computer, and visit [smx.tools](https://smx.tools/) in Google Chrome, Microsoft Edge, Brave, Vivaldi, etc.

Our tech stack uses [WebHID](https://developer.chrome.com/docs/capabilities/web-apis/hid-examples) to communicate with the stages. React is used for the UI.

## SMX stages in Linux

Linux mounts most HID devices (human interface devices) as read-only by default. But we need read/write access to talk to the stages and get the advanced readings from them. Control over read/write permissions for HID devices is managed by udev rules in Linux. For the SMX stages we will create a new file to configure them specifically.

Start by editing a new file: `sudoedit /etc/udev/rules.d/95-smx.rules`
Add the following as its contents, which specifies SMX stages by their unique vendor and product IDs:

```
KERNEL=="hidraw*", ATTRS{idVendor}=="2341", ATTRS{idProduct}=="8037", MODE="0666", TAG+="uaccess", TAG+="udev-acl"
```

Alternatively, if you can trust me absolutely:

`sudo curl --output-dir /etc/udev/rules.d -O https://smx.tools/udev/95-smx.rules`

Finally, run `sudo udevadm control --reload-rules` and `sudo udevadm trigger` to load and apply the new rule.

You should find that your stages can now be fully configured within the web app. This has been tested as working on Linux Mint and Fedora Linux using both Chromium (system package) and Vivaldi (flatpak).


## Developing

First, have [mise](https://mise.jdx.dev/) on your machine to manage your NodeJS install.

### First time setup

Install the [Biome linter/formatter extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome) in VS Code.

```
# cd into the project, then
$ mise trust
# install node.js
$ mise install

# install yarn package manager
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

This project is heavily based on the unofficial [pySMX](https://github.com/fchorney/pySMX) and the official [StepManiaX SDK](https://github.com/steprevolution/stepmaniax-sdk).
