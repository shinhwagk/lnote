workflow "Build, Test, and Publish" {
  on = "push"
  resolves = [
    "Publish",
  ]
}

action "Install" {
  uses = "borales/actions-yarn@master"
  args = "install"
}

action "Test" {
  needs = ["Install"]
  uses = "borales/actions-yarn@master"
  args = "test"
}

action "Master" {
  needs = "Test"
  uses = "actions/bin/filter@master"
  args = "branch master"
}

action "Publish" {
  needs = ["Master"]
  uses = "lannonbr/vsce-action@master"
  args = "publish -p $VSCE_TOKEN"
  secrets = ["VSCE_TOKEN"]
}

workflow "Clients Statistics" {
  resolves = [
    "graph",
    "actions/bin/sh@master",
  ]
  on = "schedule(*/5 * * * *)"
}

action "persistent" {
  uses = "./.github/persistent"
  secrets = ["SLACK_TOKEN", "SLACK_CHANNEL", "GITHUB_TOKEN"]
  env = {
    DELAY = "5"
    STAT_RANGE = "10"
  }
}

action "graph" {
  needs = ["persistent"]
  uses = "actions/bin/sh@master"
  args = ["echo a"]
}

action "new user" {
  uses = "actions/bin/curl@master"
  needs = ["persistent"]
  env = {
    url = "github.com"
  }
  args = ["${url}"]
}

action "actions/bin/sh@master" {
  uses = "actions/bin/sh@master"
  needs = ["new user"]
  args = ["ls -l ./"]
}
