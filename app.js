var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

var swig = require('swig');

var http = require('http');
var port = normalizePort(process.env.PORT || '3000');

// ---------------- db config --------------------
//create db connection
var db = require('./models/db');

//database connection, kudu connect internet T.T
db.on('error', console.error.bind(console, 'Database connection error:'));
db.on('open', function (e) {
  if (e) {
    throw e;
  } else {
    console.log('connected to database :: '+ db.name);
  }
});

// ---------------- route config --------------------
var routes = require('./routes/index');
var signup = require('./routes/signup');
var login = require('./routes/login');
var dashboard = require('./routes/dashboard');
var widget = require('./routes/widget');
var data = require('./routes/data');
var reset = require('./routes/reset');

// ---------------- express and socketio config --------------------
var app = express();

var server = http.createServer(app);

var io = require('socket.io')(server);

app.set('port', port);

// swig template engine configuration
app.engine('html', swig.renderFile);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

// Swig will cache templates for you, but you can disalbe
// that and use Express's caching instead, if you like:
app.set('view cache', false);
// to disable Swig's cache, do the following:
swig.setDefaults({ cache: false });
// NOTE: you should always cache templates in a production environment.
// Don't leave both of these to 'false' in production!

// uncomment after placing your favicon in /public
app.use(favicon(path.join(__dirname,'public','images','favicon.png')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ---------------- session --------------------
var sessionMiddleware = session({ 
  secret: 'ssshhhhh',
  resave: false,
  saveUninitialized: false,
  rolling: true
  //cookie: { maxAge: 5 * 60 * 1000 } //5 menit
});

//socket middleware
io.use(function (socket, next) {
  sessionMiddleware(socket.request, socket.request.res, next);
});

app.use(sessionMiddleware);

// ---------------- route --------------------
app.use('/', routes);
app.use('/signup', signup);
app.use('/login', login);
// dashboard route
app.use('/dashboard', dashboard);
// widget route
app.use('/widget', widget);
// init db collection
app.use('/data', data);
// reset all user status to offline
app.use('/reset', reset);


// ---------------- error handler --------------------
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);

    if (!err.status)
      err.status = 500;

    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);

  if (!err.status)
      err.status = 500;

  res.render('error', {
    error: {}
  });
});

// ---------------- model and controller --------------------
var User = require('./models/user');
var Dashboard = require('./models/dashboard');
var Widget = require('./models/widget');
var Message = require('./models/message');
var Visitor = require('./models/visitor');
var AuthCtrl = require('./controllers/AuthCtrl');
var ChatCtrl = require('./controllers/ChatCtrl');

app.locals.kunci_publik_n = '14371343929626017999139431136838112768087843761251991417949';
app.locals.kunci_publik_e = '5471737747308237468435381722180996820505264772202975279371';
app.locals.kunci_privat_d = '1659753657407600073244968390781770611643473805307669044131';
app.locals.keyIV = '207a5181f3496b208a94ec839dc98228d7f94c9dc0135daf';

var clients = [];

// ---------------- socketio here --------------------
io.on('connection', function (socket) {
  var client = {};
  var sess = socket.request.session;
  // client has session
  if (sess.idUsername) {
    var sessionId = sess.idUsername;
    var split = sessionId.split('_');
    var id = split[0];
    var username = split[1];
    var room;
    // log the connected user
    console.log(username + ' connected');
    // new client
    if (!clients[sessionId]) {
      clients[sessionId] = {
        username: username,
        id: id,
        socket: [],
        online: false
      };
      // push new client socket to clients[sessionId]
      clients[sessionId].socket.push(socket.id);
    } else {
      // push client socket to clients[sessionId]
      clients[sessionId].socket.push(socket.id);
    }

    if (!clients[sessionId].pubKey) {
      socket.emit('server pubkey', { n: app.locals.kunci_publik_n, e: app.locals.kunci_publik_e });
    }

    /*socket.on('get msg', function (data) {
      // send server keypub to socket
      if (!clients[sessionId].pubKey) {
        socket.emit('server pubkey', { n: app.locals.kunci_publik_n, e: app.locals.kunci_publik_e });
      } else {
        var chatController = new ChatCtrl(Message, Visitor);

        chatController.getLast10Msg(data.idUsername, data.idVUsername, function (err, msg) {
          console.log(msg);
          socket.emit('set msg', msg);
        });
      } 
      
    })*/
    

    // save client pubkey to session, send server keyIV to socket
    socket.on('client pubkey', function (pubkey) {
      clients[sessionId].pubKey = pubkey;
      var chatController = new ChatCtrl(Message, Visitor);
      // encrypt server keyiv
      var secretkeyiv = chatController.encryptKeyIV(app.locals.keyIV, clients[sessionId].pubKey);
      // emit to client
      socket.emit('server keyiv', secretkeyiv);
    });

    // save client keyiv to session
    socket.on('client keyiv', function (secretkeyiv) {
      var chatController = new ChatCtrl(Message, Visitor);
      // decrypt client keyiv
      var keyiv = chatController.decryptKeyIV(secretkeyiv, app.locals.kunci_publik_n, app.locals.kunci_publik_e, app.locals.kunci_privat_d);
      clients[sessionId].keyIV = keyiv;
     /* if (data.idUsername) {
        chatController.getLast10Msg(data.idUsername, data.idVUsername, function (err, msg) {
          // buat enkripnya disini yah
          socket.emit('set msg', msg);
        });
      } */
    }); 

    // create room, ex: 'chat_123_ina', room for client that connected to this dashboard and dashboard itself
    var room = 'chat_' + sess.idDashboard;
    // join the client socket to room
    socket.join(room);

    // hapus kalo udah
    console.log(clients[sessionId]);
   
    // new client, tell others that the user is online
    if (clients[sessionId].online != true) {
      clients[sessionId].online = true;
      // visitor
      if (sess.idWidget) {
        var authController = new AuthCtrl(User, Dashboard, Widget, Visitor);
        authController.loginVisitor(id, username, function (err, data) {
          io.to(room).emit('visitor online', sess.idUsername);
        });
      } else {
        // administrator
        var authController = new AuthCtrl(User, Dashboard, Widget, Visitor);
        authController.loginAdministrator(username, function (err, data) {
          io.to(room).emit('admin online', sess.idUsername);
        })
      };
    };

    // client send msg to server
    socket.on('send msg', function (data) {
      // log the encrypted msg
      console.log('Pesan dari client ' + data.sender + ': ' + data.cryptMsg);

      var chatController = new ChatCtrl(Message, Visitor);
      // decrypt the cryptMsg
      var msg = chatController.crypt(data.cryptMsg, clients[sessionId].keyIV);
      // save to db
      chatController.saveMsg(msg, data.sender, data.receiver, data.role, function (err, msg) {
        // encrypt the msg
        var cryptMsg = chatController.crypt(msg.message, app.locals.keyIV); 
        console.log('Pesan dari server: ' + cryptMsg);
        // if receiver client is connected
        if (clients[data.receiver]) {
          // broadcast to all connected receiver client
          for (var i = 0; i < clients[data.receiver].socket.length; i++) {
            socket.broadcast.to(clients[data.receiver].socket[i]).emit('receive msg', { idMessage: msg._id, 
                                                                                        cryptMsg: cryptMsg, 
                                                                                        sender: msg.sender, 
                                                                                        receiver: msg.receiver,
                                                                                        timeStamp: msg.timeSent });
          }
        }
        // broadcast to all connected sender client
        socket.emit('receive back msg', { idMessage: msg._id, 
                                          cryptMsg: cryptMsg, 
                                          sender: msg.sender, 
                                          receiver: msg.receiver,
                                          timeStamp: msg.timeSent });
        for (var j = 0; j < clients[data.sender].socket.length; j++) {
           socket.broadcast.to(clients[data.sender].socket[j]).emit('receive back msg', { idMessage: msg._id, 
                                                                                      cryptMsg: cryptMsg, 
                                                                                      sender: msg.sender, 
                                                                                      receiver: msg.receiver,
                                                                                      timeStamp: msg.timeSent });
        }
      }) 
    });

    // read msg
    socket.on('read msg', function (data) {
      var chatController = new ChatCtrl(Message, Visitor);
      chatController.readMsg(data.sender, data.receiver, data.role, function (err, numAffected) {
        socket.emit('read msg notification', { sender: data.sender, receiver: data.receiver });
        for (var j = 0; j < clients[data.receiver].socket.length; j++) {
          socket.broadcast.to(clients[data.receiver].socket[j]).emit('read msg notification', { sender: data.sender, receiver: data.receiver });
        }
      })
    });

    // get unread msg
    socket.on('get unread msg', function (data) {
       var chatController = new ChatCtrl(Message, Visitor);
      chatController.getMsg(data.sender, data.receiver, app.locals.keyIV, function (err, msg) {
        socket.emit('set unread msg', msg);
      })
    })
    
    // socket disconnect
    socket.on('disconnect', function () {
      // leave the room
      socket.leave(room);
      // check all connected client
      for (var i = 0; i < clients[sessionId].socket.length; i++) {
        // the disconnected socket found
        if (clients[sessionId].socket[i] === socket.id) {
          // remove from clients socket array
          clients[sessionId].socket.splice(i, 1);
          // check if user refresh tab or close tab
          setTimeout(function () {
            // no socket connected after timeout (user close tab)
            if (clients[sessionId].socket.length === 0) {
              clients[sessionId].online = false;

              delete clients[sessionId].pubKey;
              delete clients[sessionId].keyIV;

              // user disconnected, tell others that the user is offline
              // visitor
              if (sess.idWidget) {
                var authController = new AuthCtrl(User, Dashboard, Widget, Visitor);
                authController.logoutVisitor(id, username, function (err, visitor) {
                  io.to(room).emit('visitor offline', sess.idUsername);
                });
              } else {
                // administrator
                var authController = new AuthCtrl(User, Dashboard, Widget, Visitor);
                authController.logoutAdministrator(id, function (err, administrator) {
                  io.to(room).emit('admin offline', sess.idUsername);
                })
              }

              // destroy the session
              sess.destroy();
            }
          }, 5000 /* 5sec */);
          return;
        }
      }
      
    });
  } else {
    socket.on('logout-dashboard', function (data) {
      var room = 'chat_' + data.idDashboard;
      // join the client socket to room
      socket.join(room);

      clients[data.idUsername].online = false;

      delete clients[data.idUsername].pubKey;
      delete clients[data.idUsername].keyIV;
      
      io.to(room).emit('admin offline', data.idUsername);
    });

    socket.on('logout-widget', function (data) {
      var room = 'chat_' + data.idDashboard;
      // join the client socket to room
      socket.join(room);
      
      clients[data.idUsername].online = false;

      delete clients[data.idUsername].pubKey;
      delete clients[data.idUsername].keyIV;
      
      io.to(room).emit('visitor offline', data.idUsername);
    })
    //socket.disconnect();
  }
  
});


server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
*/

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  //debug('Listening on ' + bind);
  console.log('Server listening on ' + bind);
}


module.exports = app;
