FROM node:10

COPY persistent-actions persistent-actions

WORKDIR /persistent-actions

RUN npm i && npm run compile
RUN npm i -g .

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
