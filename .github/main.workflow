workflow "Deploy Firebase Functions" {
  on = "push"
  resolves = [
    "slack"
  ]
}

action "deploy" {
  uses = "w9jds/firebase-action@master"
  args = "deploy --token $FIREBASE_TOKEN"
  secrets = ["FIREBASE_TOKEN"]
}

action "slack" {
  needs = ["deploy"]
  uses = "Ilshidur/action-slack@master"
  secrets = ["SLACK_WEBHOOK"]
  args = "vscode-note firebase/functions hash been pushed."
}
