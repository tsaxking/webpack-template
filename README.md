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

- [x] A simple [Express](https://expressjs.com/) server
- [x] [TypeScript](https://www.typescriptlang.org/) support
- [x] [sqlite3](https://www.npmjs.com/package/sqlite3) database
- [x] Automatic database (^) building and updating
- [x] [dotenv](https://www.npmjs.com/package/dotenv) for environment variables
- [x] Three environemnts: development, test, and production
- [x] Script building and minifying
- [x] Page building with [node-html-construcotr](https://www.npmjs.com/package/node-html-constructor)
- [x] sync/async JSON, HTML, and Upload file reading/writing (./server-functions/get-file.ts) (JSON works with comments)
- [x] Sessions with custom session class
- [x] [socket.io](https://socket.io/) support
- [x] [nodemailer](https://nodemailer.com/about/) support
- [x] On start, runs npm i
- [x] Spawns 4 processes: Update, Build, Git, and Server
- [x] Logs all requests to ./logs.csv (ignored) and resets them every day at 12am
- [x] Email and message spam protection

### Client Side:
- [x] [TypeScript](https://www.typescriptlang.org/) support
- [x] [Color](https://github.com/tsaxking/colors.git)
- [x] [CustomBootstrap](https://github.com/tsaxking/custom-bootstrap.git)
- [x] [Canvas](https://github.com/tsaxking/canvas.git)
- [x] Automatic minifying and building
- [x] You can save sets of scripts and stylesheets to be used on different templates
- [x] [scss](https://sass-lang.com/) support
- [x] [socket.io](https://socket.io/) support
- [x] [animate.css](https://animate.style/) support (with some customization)
- [x] Bootstrap Colors Extended



## Usage and Documentation

This is a new project, so documentation is not complete. However, it will soon be available at [tsaxking.com/packages/server-template](https://tsaxking.com/packages/server-template)