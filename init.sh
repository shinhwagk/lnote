#!/usr/bin/env bash

repository='https://github.com/shinhwagk/vscode-note'

branch=(gh-pages 
				dockerhub/storage2file-firestore 
				dockerhub/storage2file 
				firebase/functions 
				analytics 
				npm/storage2file 
				vscode-note)

for b in ${branch[*]}; do
	echo "process $b"
  if [ -d $b ]; then
		cd "$b" && git pull
	else
		git clone --depth=1 -b "$b" "$repository" "$b" 2>/dev/null
	fi
done

git pull
