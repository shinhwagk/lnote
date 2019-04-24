#!/usr/bin/env bash

cacheDomain

git add domain.cache
git config user.name "${GITHUB_ACTOR}"
git config user.email "${GITHUB_ACTOR}@users.noreply.github.com"
git commit -m "update domain.cache"
git push
