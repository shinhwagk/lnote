#!/usr/bin/env bash

git config user.name "${GITHUB_ACTOR}"
git config user.email "${GITHUB_ACTOR}@users.noreply.github.com"

# git fetch origin clients
git checkout -b clients origin/clients

persistentActions

[[ -z $(git status -s) ]] && { echo 'no actions.'; exit 0; }

git add -A
git commit -m "update client actions"
git push -u origin analytics -v
