[![Build](https://github.com/tsaxking/webpack-template/actions/workflows/build.yml/badge.svg)](https://github.com/tsaxking/webpack-template/actions/workflows/build.yml) [![Backend](https://github.com/tsaxking/webpack-template/actions/workflows/backend.yml/badge.svg)](https://github.com/tsaxking/webpack-template/actions/workflows/backend.yml) [![e2e](https://github.com/tsaxking/webpack-template/actions/workflows/e2e.yml/badge.svg)](https://github.com/tsaxking/webpack-template/actions/workflows/e2e.yml) [![Formatter](https://github.com/tsaxking/webpack-template/actions/workflows/formatter.yml/badge.svg)](https://github.com/tsaxking/webpack-template/actions/workflows/formatter.yml) [![Typescript](https://github.com/tsaxking/webpack-template/actions/workflows/tsc.yml/badge.svg)](https://github.com/tsaxking/webpack-template/actions/workflows/tsc.yml)

# Full-Stack Web Development Starter

A starter template for full-stack web development projects.

The idea is to have a template that can be used to start a new full-stack web development project. The template includes a back-end and a front-end, and it is ready to be deployed to a cloud platform.

This includes a GitHub action to deploy documentation to GitHub Pages, and a GitHub action to create a branch on sub-repositories used to merge new changes.

## Table of Contents

-   [Full-Stack Web Development Starter](#full-stack-web-development-starter)
    -   [Table of Contents](#table-of-contents)
    -   [Installation](#installation)
    -   [Manage](#manage)
    -   [Back End](#back-end)
    -   [Front End](#front-end)
    -   [Contributing](#contributing)
    -   [Contact](#contact)

## Installation

```bash
# fork the repository
git clone https://github.com/tsaxking/webpack-template.git
cd webpack-template

# Initialize the project, this installs the dependencies and sets up the project
# Remove the default argument to customize the .env file
sh ./scripts/init.sh default
```

## Manage

You can manage the project using a cool cli interface I call the "Manager". To run, just run the command: `npm run manager`

## Back End

The back-end is a Node.js application that uses Express.js to serve the front-end and the API. This uses a PostgreSQL database to store the data.

## Front End

Using esbuild to bundle the front-end code, and the back-end to serve the front-end. The front-end is an svelte application that uses bootstrap for styling.
In the future, this will likely be replaced with Tailwind CSS.

## Contributing

Please feel free to contribute to this project. You can contribute by creating issues, or by creating pull requests.

## Contact

If there are any questions, please feel free to drop a comment on the discussions tab or contact me directly (taylor.reese.king@gmail.com)
