# Visitor Minute Tracker

An Envoy plugin that checks if visitors stayed too long.

## What it does

- Lets admins set max visit time (0-180 mins)
- Does nothing when visitors sign in
- When visitors sign out, tells you if they stayed too long

## Setup

1. Deploy to Heroku
2. Set environment variables:
   - ENVOY_CLIENT_ID
   - ENVOY_CLIENT_SECRET

3. Configure app in Envoy Dashboard:
   - Set validation URL: `/duration-validation`
   - Set sign-in endpoint: `/visitor-sign-in`
   - Set sign-out endpoint: `/visitor-sign-out`

## Local testing

```
npm install
npm start
```

## Notes

Built with:
- Express
- Envoy SDK

Make sure your Heroku app is running Node.js 18.