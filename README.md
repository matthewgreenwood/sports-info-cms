# sports-info-cms

A [Strapi](https://strapi.io) v5 Cloud CMS for sports information.

## Prerequisites

- Node.js `>=20.0.0 <=24.x.x`
- npm `>=6.0.0`

## Getting Started

### Install dependencies

```bash
npm install
```

### Configure environment

Copy the example environment file and fill in the required values:

```bash
cp .env.example .env
```

### Development

Start Strapi in watch mode (auto-restarts on file changes):

```bash
npm run develop
```

### Production

Build the admin panel and start the server:

```bash
npm run build
npm run start
```

## Strapi Cloud Deployment

This project is configured to deploy to [Strapi Cloud](https://cloud.strapi.io).

```bash
npm run deploy
```

## Project Structure

```
sports-info-cms/
├── config/          # Strapi configuration (server, database, admin, etc.)
├── database/        # Database migrations
├── public/          # Publicly served static files
├── src/
│   ├── admin/       # Admin panel customisations
│   ├── api/         # Content-type schemas, controllers, routes, services
│   └── extensions/  # Plugin extensions
└── package.json
```

## Useful Commands

| Command | Description |
|---|---|
| `npm run develop` | Start in development (watch) mode |
| `npm run start` | Start in production mode |
| `npm run build` | Build the admin panel |
| `npm run deploy` | Deploy to Strapi Cloud |
| `npm run strapi` | Display all Strapi CLI commands |
| `npm run upgrade` | Upgrade Strapi to the latest version |
