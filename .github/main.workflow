workflow "Build, Test, and Publish" {
  on = "push"
  resolves = [
    "Slack",
    "Publish",
  ]
}

action "Install" {
  uses = "nuxt/actions-yarn@node-10"
  args = "install"
}

action "Test" {
  needs = ["Install"]
  uses = "nuxt/actions-yarn@node-10"
  args = "test"
}

action "Master" {
  needs = "Test"
  uses = "actions/bin/filter@master"
  args = "branch master"
}

action "Slack" {
  uses = "Ilshidur/action-slack@master"
  needs = ["Test"]
}

action "Publish" {
  needs = ["Master"]
  uses = "shinhwagk/vsce-action@master"
  args = "publish -p $VSCE_TOKEN"
  secrets = ["VSCE_TOKEN"]
}
