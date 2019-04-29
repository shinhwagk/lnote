FROM node:10

ADD persistentActions persistentActions
RUN npm i typescript ts-node
RUN npm i -g persistentActions

ADD entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]