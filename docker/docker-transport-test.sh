#!/usr/bin/env bash
set -e

git submodule add --force https://github.com/trezor/trezor-common.git trezor-common

# note that we are not using all .proto files for this test
yarn pbjs -t json -p ./trezor-common/protob -o ./packages/integration-tests/projects/transport/messages.json --keep-case messages-bitcoin.proto messages-bootloader.proto messages-common.proto messages-crypto.proto messages-debug.proto messages-management.proto

./docker/run-next-to-tuenv.sh -s "yarn workspace @trezor/integration-tests test:transport"
