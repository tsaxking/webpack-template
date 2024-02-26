git stash &&
git pull --ff &&
git stash apply &&
git submodule foreach 'git stash && git pull origin HEAD:main && git stash apply' &&
npm i &&
git status