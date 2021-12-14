# todo: cant we use base image with ports open to trezor-user-env container?
# todo: if no, do we want proxy like in other dockerfiles?

FROM node:14

RUN apt-get update && apt-get -y --no-install-recommends install \
    ca-certificates \
    curl \
    git-all
