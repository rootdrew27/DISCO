# Technical Specs

## Authentication
Use [Auth.js](https://authjs.dev/getting-started/installation?framework=Next.js) (i.e. the next-auth package).

- OAuth will be the only permitted form of authentication.
- New users will be given a random username initially (these random names will contain a #, which is not allowed in chosen names)

- [OAuth Flow Diagram](https://authjs.dev/concepts/oauth)

## Database

- MongoDB
- DynamoDB

## Observability