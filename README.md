# Canteen

Small demo project for an internal employee canteen ordering system.

## Why I built it

I designed this project after observing a real workplace challenge at CCI: agents
often have very little time to order food, and long queues can run past their
breaks. That affects both their lunch experience and productivity. Canteen is a
simple digital ordering flow intended to reduce that queue pressure.

This is a learning and portfolio project, not a production-ready company
canteen platform. The current demo uses Gmail/Google authentication so the
complete flow can be tested. The intended production direction is to restrict
registration to verified work email domains.

## Features

- Browse products and add items to a cart as a guest.
- Sign in with Google before checkout.
- Employee voucher balances for monthly, payroll-style settlement.
- Admin area for products, users, orders, and daily summary information.
- Stripe checkout integration and email-related backend utilities.
- HTTP-only access and refresh token cookies with automatic access-token refresh.
- Responsive cart and admin layouts for smaller screens.

## Tech stack

- React 17 and React Router
- Redux Toolkit and Axios
- Styled Components and plain CSS
- Node.js, Express, and MongoDB/Mongoose
- Passport Google OAuth
- Stripe, Nodemailer, Cloudinary, and Redis-compatible rate limiting

## Project structure

```text
backend/   Express API, authentication, models, routes, and scheduled jobs
frontend/  React application and admin screens
```

## Running locally

Install dependencies in both applications:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Create environment files from the variables used in
[`backend/config/config.js`](backend/config/config.js). At minimum, local
development needs a MongoDB connection, JWT secrets, a session secret, a
frontend URL, and Google OAuth credentials for the Gmail login flow. Set
`REACT_APP_API_URL` in the frontend to the API base URL, for example
`http://localhost:5000/api`.

Start the API:

```bash
cd backend
npm run dev
```

Start the React app in a second terminal:

```bash
cd frontend
npm start
```

The default Create React App URL is `http://localhost:3000`. The backend
defaults to port `5000`.

## Work email direction

The backend already supports an approved email-domain setting through
`COMPANY_EMAIL_DOMAIN` and `ALLOW_ALL_EMAILS`. For a real deployment,
`ALLOW_ALL_EMAILS` should remain `false`, the Google OAuth callback URL should
match the deployed API exactly, and `CLIENT_URL` should match the deployed
frontend origin exactly. Work-email verification and company identity
management would be the next step before using this beyond a demo.

## Notes

This project is intentionally scoped as a small demonstration of practical
full-stack skills: authentication, protected routes, responsive UI, API
integration, data modelling, and a user-focused product idea. Payment,
voucher, email, and deployment settings still need a security and operational
review before production use.
