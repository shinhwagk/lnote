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
    "client number",
    "persistent charts",
    "push client actions",
  ]
}

action "persistent client actions" {
  needs = ["set git config"]
  uses = "./.github/persistent"
  secrets = ["SLACK_TOKEN", "SLACK_CHANNEL"]
  env = {
    DELAY = "5"
    STAT_RANGE = "10"
  }
}

action "new client number" {
  uses = "actions/bin/sh@master"
  needs = ["persistent client actions"]
  env = {
    url = "github.com"
  }
  args = ["echo ${url}"]
}

action "persistent statistics" {
  uses = "srt32/git-actions@v0.0.3"
  needs = [
    "client number",
    "new client number",
  ]
  args = ["echo a"]
  # [ -n \"$(git status -s -- statistics/client_number)\" ] && git add statistics/client_number && git commit -m 'update statistics client_number' && git push -u origin analytics -v
  secrets = ["GITHUB_TOKEN"]
}

action "client number" {
  uses = "actions/bin/sh@master"
  needs = ["persistent client actions"]
  args = ["sed -i '/^$/d' statistics/client_number; ls ./clients | wc -l >> statistics/client_number"]
}

action "create charts" {
  uses = "actions/bin/curl@master"
  needs = ["persistent statistics"]
  secrets = ["GOOGLE_WEB_URL"]
  args = "github.com"
}

action "persistent charts" {
  uses = "srt32/git-actions@v0.0.3"
  needs = ["create charts"]
  secrets = ["GITHUB_TOKEN"]
}

action "push client actions" {
  uses = "srt32/git-actions@v0.0.3"
  needs = ["persistent client actions"]
  args = ["[ -n '${git status -s}' ] && git add clients statistics-date && git commit -m 'update client actions' && git push -u analytics -v"]
  secrets = ["GITHUB_TOKEN"]
}

action "set git config" {
  uses = "srt32/git-actions@v0.0.3"
  args = ["git config user.name ${GITHUB_ACTOR}; git config user.email ${GITHUB_ACTOR}@users.noreply.github.com"]
}
