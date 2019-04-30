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

workflow "Statistics" {
  # on = "schedule(*/10 * * * *)"
  on = "push" 
  resolves = ["graph", "new user"]
}

action "persistent" {
  uses = "./.github/persistent"
  secrets = ["SLACK_TOKEN", "SLACK_CHANNEL", "GITHUB_TOKEN"]
}

action "graph" {
  needs = ["persistent"]
  uses  = "actions/bin/sh@master"
  args  = ["echo a"]
}

action "new user" {
  uses  = "actions/bin/sh@master"
  needs = ["persistent"]
  args  = ["echo user1"]
}

