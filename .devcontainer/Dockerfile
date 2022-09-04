ARG VARIANT="16-bullseye"
FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:0-${VARIANT}

RUN npm config set registry http://registry.npm.taobao.org/
# RUN npm i -g npm 
RUN npm i -g typescript webpack webpack-cli eslint
# RUN npm install -g vsce

RUN git config --global core.autocrlf input