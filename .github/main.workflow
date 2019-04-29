workflow "pa" {
  on = "push"
  resolves = [
    "persistent-actions",
  ]
}

action "persistent-actions" {
  uses = "./.github/actions"
  secrets = ["SLACK_TOKEN", "SLACK_CHANNEL"]
}
