FROM node:10

ADD cacheDomain cacheDomain
RUN npm i -g cacheDomain

ADD entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]