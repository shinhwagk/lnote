workflow "cron, persistent-actions, graph" {
  on = "push"
  resolves = ["graph"]
}

action "persistent-actions" {
  uses = "./.github/actions"
  secrets = [
    "SLACK_TOKEN",
    "SLACK_CHANNEL",
    "GITHUB_TOKEN",
  ]
}

action "graph" {
  needs = ["persistent-actions"]
  uses = "actions/bin/sh@master"
  args = ["echo a"]
}
