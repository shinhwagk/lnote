FROM node:10

COPY persistent-actions persistent-actions

RUN npm i -g persistent-actions

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
