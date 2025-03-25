# Deploying to Heroku

This document provides instructions for deploying this Next.js application to Heroku using the standard Node.js deployment approach.

## Prerequisites

- Heroku CLI installed on your machine
- Git installed on your machine
- Heroku account

## Deployment Steps

### 1. Login to Heroku

```bash
heroku login
```

### 2. Create a new Heroku application

```bash
heroku create your-app-name
```

Or link to an existing app:

```bash
heroku git:remote -a your-app-name
```

### 3. Set up environment variables

Set the necessary environment variables in Heroku:

```bash
heroku config:set NODE_ENV=production
# Add other required environment variables
# heroku config:set API_KEY=your_api_key
# etc.
```

### 4. Deploy the application

Push your code to the Heroku Git remote:

```bash
git push heroku main
```

Heroku will automatically:
1. Install dependencies based on package.json
2. Run the heroku-postbuild script which builds the UI and server
3. Start the application using the Procfile

### 5. Scale the application (if needed)

Ensure you have at least one web dyno running:

```bash
heroku ps:scale web=1
```

### 6. Open the application

```bash
heroku open
```

## Troubleshooting

### View application logs

```bash
heroku logs --tail
```

### Restart the application

```bash
heroku restart
```

### Check build packs

Ensure the Node.js buildpack is installed:

```bash
heroku buildpacks
```

If not, add it:

```bash
heroku buildpacks:set heroku/nodejs
```

## Advanced Configuration

### Custom domains

```bash
heroku domains:add www.yourdomain.com
```

### Monitor dyno usage

```bash
heroku ps
```

### Database add-ons

If you need a database, you can add one using:

```bash
heroku addons:create heroku-postgresql:hobby-dev
```

## Performance Considerations

- Heroku dynos sleep after 30 minutes of inactivity on free tier
- Consider upgrading to a paid tier for production applications
- Use caching strategies to improve performance
- Configure proper HTTP headers for caching static assets 