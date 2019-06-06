#!/bin/bash

#
# deploy script
#

#### rsync ###################################################
#-r, --recursive recurse into directories		     #
#-l, --links copy symlinks as symlinks                       #
#-t, --times preserve modification times		     #
#-z, --compress compress file data during the transfer       #
#-u, --update skip files that are newer on the receiver      #
##############################################################

host='lars@dzbvm-badi'
pem='~/.ssh/badi.pem'
workpath='~/openid/client'

#
# remove current backend sources
#
ssh -i $pem $host -tt 'bash -c -i "
mkdir -p '$workpath';
cd '$workpath';
rm *.js && rm package-lock.json
"'
#
# copy sources to server
#
rsync -rtuv --exclude='node_modules/' --exclude='.git/' --exclude='.idea/' --exclude='package-lock.json'  -e "ssh -i $pem" *.* $host:$workpath
#
# install new dependencies and restart backend service 
#
ssh -i $pem $host -tt 'bash -c -i "
cd '$workpath';
npm i;
node ./node_modules/.bin/pm2 stop openid-demo;
node ./node_modules/.bin/pm2 start ./bin/www --name openid-demo;
"'

