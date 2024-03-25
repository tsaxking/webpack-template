git pull --ff &&
git submodule foreach 'git pull origin HEAD:main' &&
npm i &&
git status