#!/usr/bin/env bash

persistentActions

git add -A
git config user.name "${GITHUB_ACTOR}"
git config user.email "${GITHUB_ACTOR}@users.noreply.github.com"
git commit -m "update client actions"
git push origin actions-statistics