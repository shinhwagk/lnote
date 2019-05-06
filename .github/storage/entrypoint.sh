#!/usr/bin/env bash

git config user.name "${GITHUB_ACTOR}"
git config user.email "${GITHUB_ACTOR}@users.noreply.github.com"

git checkout -b analytics origin/analytics

storage

git add storage
git commit -m "update storage timestamp"
git push -u origin analytics
