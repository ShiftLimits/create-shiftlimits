# ShiftLimits Create

A scaffolding tool for quickly creating opinionated starter projects with `npm init shiftlimits`!

**Note:** This is under early active development and may be subject to breaking changes until it reaches a stable version 1.0.0.
## What is this?

This package allows you to use `npm init shiftlimits` to get started using TypeScript to create websites and software with Vue and Tailwind CSS in the frontend and NestJS in the backend. It will prompt you for information about what kind project you're building and uses your answers to scaffold a starter project for you!

I have structured each starter template based on my own work, preferences, and experiences. These templates will be updated when I change my preferences based on new experiences I gain through work. They may also be incomplete until this project reaches stable version `1.0.0`.

This project is based on [`create-vue`](https://github.com/vuejs/create-vue).

## Usage

Use the `npm init` command:

```bash
$ npm init shiftlimits
```

## Available Templates

There are a few different template builders to choose from.

### Vue and Tailwind CSS
#### `vue-website`

Construct a Vue and Tailwind CSS website, powered by Vite. All features are optional.

##### Features
- Routing with `vue-router`
- Server Side Rendering & Static Site Generation support
- Simple Application Core – Layout system with pages (includes routing)
  - Based on Nuxt structure, uses Vite imports to read layout directory
- Color Suite – An in-browser editor for your website's color palette
- ShiftLimits UI – A set a pre-made components and plugins for Vite, Vue and Tailwind for rapid development (includes Color Suite)
  - Choose which features of SLUI to install from several presets or customize from a list
- Vitest – Extremely fast Unit testing
- Yorkie – Verify that Git commits adhere to the conventional commit format with git hooks

## License

`create-shiftlimits` is [MIT](LICENSE) licensed.
