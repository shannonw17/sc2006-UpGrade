Please follow these steps to have seeded examples in the DB

1. on your terminal make sure you are in \web, 
(windows)
copy .env.example.txt .env
(Mac)
cp .env.example.txt .env

2. Run these commands on terminal
npm install
npx prisma db push
npx prisma db seed

note: make sure under your .gitignore these lines exist:

# env files (can opt-in for committing if needed)
.env*
