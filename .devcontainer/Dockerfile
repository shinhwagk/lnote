ARG VARIANT="16-bullseye"
FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:0-${VARIANT}

RUN npm config set registry http://registry.npm.taobao.org/
# RUN npm i -g npm 
RUN npm i -g typescript@4.5.4 webpack@5.66.0 webpack-cli@4.9.1 eslint
# RUN npm install -g vsce

RUN git config --global core.autocrlf input