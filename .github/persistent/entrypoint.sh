#!/usr/bin/env bash

git config user.name "${GITHUB_ACTOR}"
git config user.email "${GITHUB_ACTOR}@users.noreply.github.com"

persistentActions

[[ -z $(git status -s) ]] && { echo 'no actions.'; exit 0; }

git add -A
git commit -m "update client actions"
git push -u origin analytics -v
