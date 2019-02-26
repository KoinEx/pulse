const env = process.env.NODE_ENV || 'dev' ;
const dev = {
  host:'0.0.0.0',
  port:4000,
  protocol:'http'
};

const config = {
  dev
};

//config of our server


module.exports = config[env];