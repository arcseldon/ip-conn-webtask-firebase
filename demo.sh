#!/usr/bin/env bash
rm -Rf .tmp
mkdir -p .tmp &&
printf "\nRetrieving IP Address..\n" &&
npm run ipinjector | tee .tmp/out &&
printf "\nCopy sample.csv to config.csv..\n" &&
/bin/cp build/tools/sample.csv build/tools/config.csv &&
printf "\nDeploying Webtask..\n" &&
./loader.sh | tee -a .tmp/out &&
printf "\nCalling webtask with own IP..\n\n" &&
node ./build/test/tools/curlBuilder.js
printf "\n\n"
