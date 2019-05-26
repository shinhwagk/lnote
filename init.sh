#!/usr/bin/env bash

repository='https://github.com/shinhwagk/vscode-note'

branch=(vscode-note gh-pages dockerhub@storage2file-firestore dockerhub@storage2file firebase@functions)

for b in ${branch[*]}; do
	  if [ -d $b ]; then
		      cd "$b" && git pull &
		        else
				    git clone --depth=1 -b "$b" "$repository" "$b" &
				      fi
			      done

			      wait
