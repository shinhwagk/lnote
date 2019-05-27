#!/usr/bin/env bash

repository='https://github.com/shinhwagk/vscode-note'

branch=(gh-pages dockerhub/storage2file-firestore dockerhub/storage2file firebase/functions analytics npm/storage2file vscode-note)

ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

for b in ${branch[*]}; do
	echo "process $b"
  if [ -d "$b" ]; then
		cd $b && git pull && cd $ROOT
	else
		echo "clone repo ${b}"
		git clone --depth=1 -b "$b" "$repository" "$b"
	fi
done

git pull
