# spa-runtime-config

A lightweight utility for loading runtime configuration in Vite-based frontend applications. Configuration is fetched from static JSON files at runtime, allowing values to be changed per environment without rebuilding the application.

## Installation

The package is published to GitHub Packages under the `@byhofman` scope. Add a scope registry line to your `.npmrc`:

```
@byhofman:registry=https://npm.pkg.github.com
```

Then install:

```bash
npm install @byhofman/spa-runtime-config
```

> GitHub Packages requires authentication even for public packages. Add a personal access token with the `read:packages` scope to your `~/.npmrc`:
> `//npm.pkg.github.com/:_authToken=<github-token>`

## Development

```bash
npm install       # install dependencies
npm run build     # type-check + build to dist/
npm run test      # run tests in watch mode
npm run test:run  # run tests once (CI)
npm run coverage  # run tests with coverage report
```

## Publishing

The `.github/workflows/publish.yml` pipeline runs on every `v`-prefixed tag push (e.g. `v1.2.0`). It installs dependencies, runs tests, builds the package, and publishes it to GitHub Packages with the version taken from the tag.

## Documentation

See [docs/Usage.md](docs/Usage.md) for integration and API reference.
