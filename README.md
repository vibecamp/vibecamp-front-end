
# Vibecamp web app

This repository contains both the front-end and the back-end for Vibecamp's new web app. This app will encompass everything a ticketholder needs for registration, communication, planning, and navigation of the event itself.

## Architecture

The front- and back-end here both run on render.com, alongside our Postgres DB. Pushes to either subdirectory on the main branch will automatically deploy to production.

The back-end is built on [Deno](https://deno.land), a modern TypeScript-native JavaScript runtime (analogous to Node). It uses the Oak web framework (analogous to Express). It exposes a fairly standard HTTP API, used by the front-end. The API is organized into a `v1` subset, to future-proof for a scenario where we could need to make breaking changes while maintaining compatibility.

The front-end is a single-page app. It does not have a running server in production; at build time, HTML + CSS + client-side JS files are built and then pushed to render.com's CDN.

### Code-sharing

The front-end imports several files directly from the back-end (it can do so because both are written in TypeScript). Most commonly, it imports shared types used by the back-end to guarantee the two agree on the data they're working with.

### API

All routes in the back-end API (except one) are defined using a `defineRoute()` function, which standardizes how they are configured and helps enforce eg. authentication. It also imposes strong types on the request and response bodies.

Every route defined this way has a set of types configured under `types/route-types.ts`, describing (among other things) its request and response formats. These types are then used *directly* by the front-end to make sure the two agree on the API contract.

On the front-end, this happens through the `vibefetch()` function. This function enforces that a request:
1. Is to a valid route
2. Takes the expected request `body`
3. Returns the expected response type

### Database access

The database pool is created in `utils/db.ts`. This module exports a couple of functions to help make connection usage more robust: `withDBConnection()` and `withDBTransaction()`.

Each of these functions takes a callback, which is passed a DB client. That client can be used to run any quer(ies) that need running, returning any results that will be passed back through to where the `with` function was called.

Internally, `withDBConnection()` will acquire a connection from the pool, run the callback appropriately, and then make sure the connection is released back into the pool. `withDBTransaction()` will do the same with a Postgres transaction (automatically completing the transaction and then releasing the connection at the end).

## Running locally

To run a local back-end, you'll first need Deno installed. It can be found [on the web, or in some package managers](https://deno.land/manual/getting_started/installation).

Next you'll need to grab all the back-end environment secrets from render.com and set them in your local environment (`.env` files are supported in both the front-end and back-end directories), and then from `back-end/` run:
```
deno task dev
```

> Note: The `DB_URL` set in production is internal to render.com's servers. For local development, you'll need to get the "External Database URL" from the db on render.com and use that instead.

To run the front-end locally you'll need Node installed, and you'll need to do an `npm install` from within the `front-end/` directory. Then you'll need to set the front-end env variables.

> Note: `BACK_END_ORIGIN` can be pointed at the live back-end on render.com or at the back-end you're running on localhost

> Note: When setting `STRIPE_PUBLIC_KEY`, make sure you use the test key for local testing of purchase flows! The one set in production will be the production key!

Then you can either run it in dev mode:
```
npm run dev
```
or run it in production-ish mode:
```
npm run build && npm run serve
```
Dev mode will automatically re-compile files that are changed and saved, though a page refresh will be required (hot module reloading is not supported at time of writing).

By default the back-end starts on port 10000 and the front-end will make API requests to `http://127.0.0.1:10000`, so if you're running the back-end locally you're good. However you can also point your local front-end at the production back-end, by getting the `BACK_END_ORIGIN` from the production front-end on render.com and setting it locally.