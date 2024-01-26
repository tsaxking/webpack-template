npx prettier . --write;
deno fmt .;
npx eslint . --ignore-pattern ./node_modules --ignore-pattern **/*.js --ignore-pattern ./dist --ignore-pattern **/submodules;
deno test --unstable-ffi --allow-all --no-check;
deno check **/*.ts