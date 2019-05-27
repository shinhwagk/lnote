workflow "Clients Statistics" {
  on = "schedule(10 * * * *)"
  resolves = [
    "client number",
    "persistent charts",
    "push client actions",
    "storage2file",
    "shinhwagk/vscode-note@dockerhub/storage-charts",
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
  uses = "shinhwagk/vscode-note@dockerhub/storage2file"
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

action "storage2file-firestore" {
  needs = ["storage2file"]
  uses = "shinhwagk/vscode-note@dockerhub/storage2file-firestore"
  secrets = [
    "SERVICE_ACCOUNT_KEY",
    "GITHUB_TOKEN",
  ]
}

action "persistent client actions" {
  uses = "./.github/persistent"
  secrets = ["SLACK_TOKEN", "SLACK_CHANNEL"]
  env = {
    DELAY = "5"
    STAT_RANGE = "10"
  }
  needs = ["storage2file-firestore"]
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
  args = [" [ -n \"$(git status -s -- statistics)\" ] && git add statistics && git commit -m 'update statistics' && git push -u origin analytics -v"]
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
  args = ["[ -n '${git status -s}' ] && git add clients statistics-date && git commit -m 'update client actions' && git push -u origin analytics -v"]
  secrets = ["GITHUB_TOKEN"]
}

action "set git config" {
  uses = "srt32/git-actions@v0.0.3"
  args = ["git config user.name ${GITHUB_ACTOR}; git config user.email ${GITHUB_ACTOR}@users.noreply.github.com"]
}

action "shinhwagk/vscode-note@dockerhub/storage-charts" {
  uses = "shinhwagk/vscode-note@dockerhub/storage-charts"
  needs = ["storage2file-firestore"]
  secrets = ["ACTIVE_URL", "NEW_URL", "NOTES_URL"]
}
