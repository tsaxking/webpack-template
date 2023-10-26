# template

Hello! This is a template that is expandable for many different styles of projects


## Installation

Following this [stackoverflow](https://stackoverflow.com/questions/62630485/is-it-possible-to-create-a-new-git-repository-from-a-template-only-using-the-com) to install


### New method:

```bash
# You must install the github cli tool: https://cli.github.com/
gh repo create <name of repository> --template=tsaxking/server-template
# OR
gh repo create <name of repository> --template=https://github.com/tsaxking/server-template.git
```

### Old method:

```bash
git clone https://github.com/tsaxking/server-template.git
cd server-template
rm -rf .git
git init
git add .
git commit -m "Initial commit"
# Now, Create a new repository on github and copy the link to the repository
gh repo create <name of repository>
git remote add origin <link to repository>
git push -u origin master
```

## What's included

Here is a small summary of what is included in this template

### Server Side:


### Client Side:



## Usage and Documentation

This is a new project, so documentation is not complete. However, it will soon be available at [tsaxking.com/packages/server-template](https://tsaxking.com/packages/server-template)