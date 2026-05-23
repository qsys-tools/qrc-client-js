# qsys-tools main repo

The qrc-client documentation is [here](./packages/qrc-client-js)

#### Development

This monorepo uses the [`moon` task runner](https://moonrepo.dev/), and [`pnpm` package manager](https://pnpm.io/) for development.

 1. Clone the repo.
 2. [Install `moon`](https://moonrepo.dev/docs/install#proto). (I prefer doing so via `proto`, but any option should work).
 3. Run a complete build with `moon ci`. This performs typechecking, linting, and runs all unit tests.

The project includes sample Q-Sys designs for testing. Those tests can only be run locally after launching an emulator.
Any tests that require the emulator can be skipped by setting the `CI` environment variable. `CI=1 moon ci`.

#### Contributions

Please make sure you run the tests / linter locally against the design file relevant to where you are making changes. Feel free to check-in any changes to the test designs required.
