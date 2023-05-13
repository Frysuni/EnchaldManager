module.exports = {
  apps: [
    {
      name: require('./package.json').name,
      script: "npm run start",
      autorestart: true,
      max_restarts: 3,
      restart_delay: 3000,
    },
  ],
};
