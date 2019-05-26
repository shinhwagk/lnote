FROM node:10

RUN npm i -g github:shinhwagk/vscode-note#dockerhub/storage2file

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
