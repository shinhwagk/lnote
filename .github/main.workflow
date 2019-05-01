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
  on = "push"
  resolves = [
    "graph",
    "client number",
    "persistent statistics",
  ]

  #   on = "schedule(*/5 * * * *)"
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
  uses = "actions/bin/sh@master"
  needs = ["persistent"]
  env = {
    url = "github.com"
  }
  args = ["echo ${url}"]
}

action "persistent statistics" {
  uses = "srt32/git-actions@v0.0.3"
  needs = [
    "new user",
    "client number",
  ]
  args = ["git checkout analytics && [[ -n $(git status -s) ]] && git add statistics/client_number && git commit -m 'update statistics client_number' && git push -u origin analytics -v"]
  secrets = ["GITHUB_TOKEN"]
}

action "client number" {
  uses = "actions/bin/sh@master"
  needs = ["persistent"]
  args = ["ls ./clients | wc -l >> statistics/client_number"]
}
