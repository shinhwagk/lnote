FROM node:10

WORKDIR /storage-ts

COPY package.json .
COPY bin bin
COPY lib.ts .
COPY tsconfig.json .
COPY webpack.conf.js .

RUN npm i --unsafe-perm=true -g .

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
