FROM node:10

WORKDIR /storage2file

COPY package.json .
COPY bin bin
COPY lib.ts .
COPY tsconfig.json .

RUN npm i --unsafe-perm=true -g .

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
