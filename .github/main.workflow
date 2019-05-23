workflow "Build, Test, and Publish" {
  on = "push"
  resolves = [
    "Publish",
  ]
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

workflow "Clients Statistics" {
  on = "schedule(10 * * * *)"
  resolves = [
    "active client number",
    "create note number",
    "GitHub Action for npm",
    "persistent statistics",
  ]
}

action "storage messages" {
  needs = ["set git config"]
  uses = "./.github/storage"
  secrets = [
    "SLACK_TOKEN",
    "SLACK_CHANNEL",
    "FIREBASE_FUNCSTIONS_URL",
    "GITHUB_TOKEN",
  ]
  env = {
    DELAY = "10"
    RANGE = "60"
  }
}

action "storage2file" {
  needs = ["set git config"]
  uses = "./.github/storage2file"
  secrets = [
    "SLACK_TOKEN",
    "SLACK_CHANNEL",
    "GITHUB_TOKEN",
  ]
  env = {
    DELAY = "10"
    RANGE = "60"
  }
}

action "new client number" {
  uses = "actions/bin/sh@master"
  env = {
    url = "github.com"
  }
  args = ["echo ${url}"]
}

action "persistent statistics" {
  uses = "srt32/git-actions@v0.0.3"
  needs = [
    "new client number",
    "active client number",
    "GitHub Action for npm",
    "create note number",
  ]
  args = [" [ -n \"$(git status -s -- statistics)\" ] && git add statistics && git commit -m 'update statistics' && git push -u origin analytics -v"]
  secrets = ["GITHUB_TOKEN"]
}

action "active client number" {
  uses = "actions/bin/sh@master"
  needs = [
    "storage2firestore",
  ]
  args = ["sed -i '/^$/d' statistics/client_number; ls ./clients | wc -l >> statistics/client_number"]
}

action "create note number" {
  uses = "srt32/git-actions@v0.0.3"
  needs = [
    "storage2firestore",
  ]
  args = ["[ -n '${git status -s}' ] && git add clients statistics-date && git commit -m 'update client actions' && git push -u origin analytics -v"]
  secrets = ["GITHUB_TOKEN"]
}

action "set git config" {
  uses = "srt32/git-actions@v0.0.3"
  args = ["git config user.name ${GITHUB_ACTOR}; git config user.email ${GITHUB_ACTOR}@users.noreply.github.com"]
}

action "storage2firestore" {
  uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
  needs = ["storage2file"]
}

action "GitHub Action for npm" {
  uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
  needs = ["storage2firestore"]
}
