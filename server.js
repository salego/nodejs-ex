//  OpenShift sample Node application
var express = require('express'),
    app     = express(),
    morgan  = require('morgan');
    
Object.assign=require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";
console.log('kumar: mongoURLLable: ', mongoURLLabel);
console.log('kumar: db service name: ', process.env.DATABASE_SERVICE_NAME);

if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
  console.log('kumar: process.env.DATABASE_SERVICE_NAME: ', process.env.DATABASE_SERVICE_NAME);
  var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
      mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
      mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
      mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
      mongoPassword = process.env[mongoServiceName + '_PASSWORD']
      mongoUser = process.env[mongoServiceName + '_USER'];
 console.log('kumar: mongoHost: ', mongoHost);
    
  if (mongoHost && mongoPort && mongoDatabase) {
    mongoURLLabel = mongoURL = 'mongodb://';
    if (mongoUser && mongoPassword) {
      mongoURL += mongoUser + ':' + mongoPassword + '@';
      console.log('kumar: host and user/pss found: mongoURL: ', mongoURL);
    }
    // Provide UI label that excludes user id and pw
    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;
    console.log('kumar: host and user/pss NOT found: mongoURL: ', mongoURL);
  }
}
var db = null,
    dbDetails = new Object();

var initDb = function(callback) {
    console.log('kumar: inside initDB function, db: ',db);
  if (mongoURL == null){
      console.log('kumar: inside initDB function if mongoURL, mongoURL: ',mongoURL);
      console.log('kumar: inside initDB function if mongoURL, db: ',db);
      return;
  }

  var mongodb = require('mongodb');
    console.log('kumar: inside initDB function, mongodb: ', mongodb);
  if (mongodb == null) return;
  
  mongodb.connect(mongoURL, function(err, conn) {
    console.log('kumar: Just before calling mongodb connect: mongoURL: ', mongoURL,mongodb);
    if (err) {
      callback(err);
      return;
    }

    db = conn;
    dbDetails.databaseName = db.databaseName;
    dbDetails.url = mongoURLLabel;
    dbDetails.type = 'MongoDB';

    console.log('Connected to MongoDB at: %s', mongoURL);
  });
};
console.log('kumar: outside initDB , db: ',db);
app.get('/', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
      console.log('kumar: before calling initDb from get root : ',db);
    initDb(function(err){});
  }
    console.log('kumar: AFTER calling initDb from get root : ',db);
  if (db) {
    var col = db.collection('counts');
    // Create a document with request IP and current time of request
    col.insert({ip: req.ip, date: Date.now()});
    col.count(function(err, count){
      if (err) {
        console.log('Error running count. Message:\n'+err);
      }
      res.render('index.html', { pageCountMessage : count, dbInfo: dbDetails });
    });
  } else {
    res.render('index.html', { pageCountMessage : null});
  }
});

app.get('/pagecount', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
      console.log('kumar: before calling initDb from get pagecount : ',db);
    initDb(function(err){});
  }
  if (db) {
       console.log('kumar: AFTER calling initDb from get pagecount : ',db);
    db.collection('counts').count(function(err, count ){
      res.send('{ pageCount: ' + count + '}');
    });
  } else {
    res.send('{ pageCount: -1 }');
  }
});

// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

initDb(function(err){
  console.log('Error connecting to Mongo. Message:\n'+err);
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
