#!/usr/bin/env bash

git config user.name "${GITHUB_ACTOR}"
git config user.email "${GITHUB_ACTOR}@users.noreply.github.com"

git checkout -b analytics origin/analytics

curl -s $ACTIVE_URL -o charts-data/active.json
curl -s $NEW_URL    -o charts-data/new.json
curl -s $NOTES_URL  -o charts-data/notes.json

git add charts-data
git commit -m "update charts data"
git push -u origin analytics
