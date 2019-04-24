workflow "Cache Domain" {
  on = "push"
  resolves = ["actions"]
}

action "actions" {
  uses = "./.github/actions"
  secrets = ["GITHUB_TOKEN"]
}
