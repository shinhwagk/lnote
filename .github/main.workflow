workflow "Build, Test, and Publish" {
  on = "push"
  resolves = ["Slack"]
}

action "Filter" {
  uses = "actions/bin/filter@master"
  args = "branch vscode-note"
}

action "Install" {
  needs = ["Filter"]
  uses = "borales/actions-yarn@master"
  args = "install"
}

action "Test" {
  needs = ["Install"]
  uses = "borales/actions-yarn@master"
  args = "test"
}

action "Publish" {
  needs = ["Test"]
  uses = "lannonbr/vsce-action@master"
  args = "publish -p $VSCE_TOKEN"
}

action "Slack" {
  uses = "Ilshidur/action-slack@master"
  needs = ["Publish"]
  args = "publish extension success."
  secrets = ["SLACK_WEBHOOK"]
}
