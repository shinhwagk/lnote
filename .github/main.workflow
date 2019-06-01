workflow "Build, Test, and Publish" {
  on = "push"
  resolves = ["Slack"]
}

action "Tag" {
  uses = "actions/bin/filter@master"
  args = "tag v*"
}

action "Install" {
  needs = ["Tag"]
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
  secrets = ["VSCE_TOKEN"]
}

action "Slack" {
  uses = "Ilshidur/action-slack@f37693b4e0589604815219454efd5cb9b404fb85"
  needs = ["Publish"]
  args = "publish extension success."
  secrets = ["SLACK_CHANNEL"]
}
