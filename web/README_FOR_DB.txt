Please follow these steps to have seeded examples in the DB

1. on your terminal make sure you are in \web, 
create a .env file

2. make sure under your .gitignore these lines exist:

# env files (can opt-in for committing if needed)
.env*

3.In your created .env file paste this:

# Environment variables declared in this file are automatically made available to Prisma.
# See the documentation for more detail: https://pris.ly/d/prisma-schema#accessing-environment-variables-from-the-schema

# Prisma supports the native connection string format for PostgreSQL, MySQL, SQLite, SQL Server, MongoDB and CockroachDB.
# See the documentation for all the connection string options: https://pris.ly/d/connection-strings

DATABASE_URL="file:./dev.db"

4. Run these commands on terminal
npm install
npx prisma db push
npx prisma db seed
npm run dev 
