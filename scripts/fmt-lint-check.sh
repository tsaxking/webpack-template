npx prettier . --write &&
npx eslint **/*.ts --fix &&
tsc &&
npm run build &&
if $1 == "lite"; then
    sh scripts/check-lite.sh
else
    sh scripts/check-full.sh
fi