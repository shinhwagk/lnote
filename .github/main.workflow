workflow "New workflow" {
  on = "push"
  resolves = ["actions/bin@sh"]
}

action "actions/bin@sh" {
  uses = "actions/bin@sh"
}
