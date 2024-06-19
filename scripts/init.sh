npm i &&
git submodule update --init --recursive --remote &&
npm run init $1 &&
sh scripts/db-init.sh