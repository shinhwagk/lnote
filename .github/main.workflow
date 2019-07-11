# workflow "Clients Statistics" {
#   resolves = [
#     "push charts data",
#   ]
#   on = "schedule(15 * * * *)"
# }

# action "storage2file" {
#   needs = ["set git config"]
#   uses = "shinhwagk/vscode-note@dockerhub/storage2file"
#   secrets = [
#     "SLACK_TOKEN",
#     "SLACK_CHANNEL",
#     "GITHUB_TOKEN",
#   ]
#   env = {
#     DELAY = "10"
#     RANGE = "60"
#   }
# }

# action "storage2file-firestore" {
#   needs = ["storage2file"]
#   uses = "shinhwagk/vscode-note@dockerhub/storage2file-firestore"
#   secrets = [
#     "SERVICE_ACCOUNT_KEY",
#     "GITHUB_TOKEN",
#   ]
# }

# action "new client number" {
#   uses = "actions/bin/sh@master"
#   env = {
#     url = "github.com"
#   }
#   args = ["echo ${url}"]
# }

# action "persistent statistics" {
#   uses = "srt32/git-actions@v0.0.3"
#   needs = [
#     "new client number",
#   ]
#   args = [" [ -n \"$(git status -s -- statistics)\" ] && git add statistics && git commit -m 'update statistics' && git push -u origin analytics -v"]
#   secrets = ["GITHUB_TOKEN"]
# }

# action "push charts data" {
#   uses = "srt32/git-actions@v0.0.3"
#   needs = [
#     "storage-charts@notes",
#     "storage-charts@active",
#     "storage-charts@new",
#   ]
#   args = ["[ -n '${git status -s charts-data}' ] && git add charts-data && git commit -m 'update charts data' && git push -u origin analytics -v"]
#   secrets = ["GITHUB_TOKEN"]
# }

# action "set git config" {
#   uses = "srt32/git-actions@v0.0.3"
#   args = ["git config user.name ${GITHUB_ACTOR}; git config user.email ${GITHUB_ACTOR}@users.noreply.github.com; git checkout -b analytics origin/analytics"]
# }

# action "storage-charts@active" {
#   uses = "actions/bin/curl@master"
#   needs = ["storage2file-firestore"]
#   secrets = ["ACTIVE_URL"]
#   args = "-s $ACTIVE_URL -o charts-data/active.json"
# }

# action "storage-charts@new" {
#   uses = "actions/bin/curl@master"
#   needs = ["storage2file-firestore"]
#   secrets = ["NEW_URL"]
#   args = "-s $NEW_URL -o charts-data/new.json"
# }

# action "storage-charts@notes" {
#   uses = "actions/bin/curl@master"
#   needs = ["storage2file-firestore"]
#   secrets = ["NOTES_URL"]
#   args = "-s $NOTES_URL -o charts-data/notes.json"
# }
