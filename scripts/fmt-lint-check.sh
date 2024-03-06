npx prettier . --write &&
npx eslint **/*.ts --fix &&
tsc &&
npm test