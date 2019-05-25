workflow "Deploy Firebase Functions" {
  on = "push"
  resolves = [
    "deploy",
  ]
}

action "deploy" {
  uses = "w9jds/firebase-action@master"
  args = "deploy --token $FIREBASE_TOKEN"
  secrets = ["FIREBASE_TOKEN"]
}