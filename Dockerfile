FROM node:10

RUN npm i -g --unsafe-perm=true github:shinhwagk/vscode-note#npm/storage2file

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
