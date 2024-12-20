branch=$1

if [ -z "$branch" ]; then
  echo "Usage: $0 <branch>"
  exit 1
fi

git merge --no-commit --no-ff $branch

if [ $? -eq 0 ]; then
    echo "Dry-run successful"
    git merge --abort
else
    echo "Dry-run failed"
    git merge --abort
fi