# Full-Stack Web Development Starter

[![Build](https://github.com/tsaxking/webpack-template/actions/workflows/build.yml/badge.svg)](https://github.com/tsaxking/webpack-template/actions/workflows/build.yml) [![Backend](https://github.com/tsaxking/webpack-template/actions/workflows/backend.yml/badge.svg)](https://github.com/tsaxking/webpack-template/actions/workflows/backend.yml) [![e2e](https://github.com/tsaxking/webpack-template/actions/workflows/e2e.yml/badge.svg)](https://github.com/tsaxking/webpack-template/actions/workflows/e2e.yml) [![Formatter](https://github.com/tsaxking/webpack-template/actions/workflows/formatter.yml/badge.svg)](https://github.com/tsaxking/webpack-template/actions/workflows/formatter.yml) [![Typescript](https://github.com/tsaxking/webpack-template/actions/workflows/tsc.yml/badge.svg)](https://github.com/tsaxking/webpack-template/actions/workflows/tsc.yml)

A starter template for full-stack web development projects.

The idea is to have a template that can be used to start a new full-stack web development project. The template includes a back-end and a front-end, and it is ready to be deployed to a cloud platform.

This includes a GitHub action to deploy documentation to GitHub Pages, and a GitHub action to create a branch on sub-repositories used to merge new changes.

## Features

- Front end: Svelte
- Back end: Express (with some more features)
- Database: Postgres (Will be adding more soon)
- Front/Back end data structure communication: Custom built
    - This is a custom built system that allows for easy communication between the front and back end. It is built to be easy to use and easy to understand.
    - Front end state management implements svelte/store "writables" for reactive state management
    - Back end state management creates an abstracted state management system from the database
    - Permissions are built into the system to allow for easy access control (Role Based Access Control)
    - The system can create different "universes" which allow for data for different clients/"servers" to be stored in the same tables, but not be accessible to each other
    - Query streaming is built into the system to allow for low memory usage when querying large amounts of data and sending to the front end
    - Automatic updating is integrated through websockets (socket.io) to allow for real-time updates to the front end in the universe'
- CLI: Custom built
    - The CLI (`npm run manager`) is a custom built CLI that allows for easy management of the whole project. It is fully scalable and can be used to manage the project at any size.

## Getting Started

[Svelte](./docs/svelte/index.md)

[Server](./docs/server/index.md)

[Shared](./docs/shared/index.md)

[CLI](./docs/manager/index.md)

[Structs](./docs/structs/index.md)

[Testing](./docs/testing/index.md)

## Future Plans

- Server Side Rendering Multi-Page Applications
    - Eventually, I would like to include svelte-kit to allow for server-side rendering of multi-page applications. I haven't yet decided if it is compatible with the custom built data structure communication system.
- Knex.js integration
- Docker integration
    - Docker integration would allow for easy deployment of the project to any cloud platform.
- Cypress testing
    - I would like to include cypress testing for the front end and back end to allow for easy testing of the whole system.

## License

MIT License

Copyright (c) 2023 tsaxking

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
