workflow "Build, Test, and Publish" {
  on = "push"
  resolves = [
    "Tag",
  ]
}

action "Tag" {
  uses = "actions/bin/filter@master"
  args = "tag v*" 
}
