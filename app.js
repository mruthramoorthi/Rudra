const express = require('express');
const hbs = require('hbs');
const path = require('path');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const crypto = require('crypto');
const dotenv = require('dotenv');
const session = require('express-session');
const flash = require('connect-flash');
const rateLimit = require('express-rate-limit');
const getFolderStructure = require('./folderStructure');
const { generateDynamicRoutes } = require('./dynamicRoutes');
const { handleImageUpload } = require('./imageUpload');
const { registerHelpers } = require('./helpers');
const backendCntrollers = require('./controllers/backend-functions');
const ejs = require('ejs');
const http = require('http');
const socketIo = require('socket.io');

dotenv.config({ path: '.env' });

const app = express();
const server = http.createServer(app);  // Create HTTP server to use with Socket.IO
const io = socketIo(server);  // Initialize Socket.IO with the server

let onlineUsers = {};  // Store active users by their userId or socketId

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1-minute window
  max: 1500, // Allow up to 500 requests per minute per IP
  message: 'Too many requests from this IP, please try again later.',
  headers: true,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers (deprecated)
});

app.use(limiter);

// Setup middlewares
app.use(session({ secret: 'honey-bunny', resave: false, saveUninitialized: true }));
app.use(flash());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// Add these with higher limits:
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(helmet());
app.use(cookieParser());

// Middleware to generate and set a nonce for inline scripts
app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.nonce = nonce;  // Pass the nonce to the views
  res.setHeader('Content-Security-Policy', `script-src 'self' 'nonce-${nonce}'`);
  next();
});

// Serve static assets (CSS, JS, Images, etc.)
app.use(express.static(path.join(__dirname, 'public'))); // Adjust the path as needed
// Mount custom backend routes

// Setup view engine
app.set("view engine", "hbs");
app.set('view cache', false);
const partialsPath = path.join(__dirname, "./views/partials");
hbs.registerPartials(partialsPath);
hbs.cache = {};
hbs.registerHelper("eq", function (a, b) {
  return a === b;
});
registerHelpers();

// Folder structure handling
const masterFolderPath = path.join(__dirname, 'views/masters');
let cachedFolderStructure = getFolderStructure.getFolderStructure(masterFolderPath);

// User login validation
app.use(async (req, res, next) => {
  try {
    if (req.cookies.userToken) {
      const check_lastLoginOfCookie = await backendCntrollers.selectQuery('select * from login_users where deleteon=? and cookie=? order by uniqueid desc', ['0000-00-00', req.cookies.userToken]);
      if(check_lastLoginOfCookie[0])
      {
        const users_rights = await backendCntrollers.selectQuery('select group_concat(roles) as item from user_roles where deleteon=? and userid=? and branches=? order by uniqueid desc', ['0000-00-00', check_lastLoginOfCookie[0].userid, check_lastLoginOfCookie[0].site]);
        const rolesList = users_rights[0].item.split(','); // Convert it into an array
        const access_files = await backendCntrollers.selectQuery("SELECT GROUP_CONCAT(DISTINCT t1.path ORDER BY t1.path) as path,GROUP_CONCAT(DISTINCT t2.pagename ORDER BY t1.path) AS pagename FROM all_pages_roles AS t1 JOIN all_pages_details AS t2 ON t1.path = t2.path WHERE t1.deleteon =? AND t1.role IN (?) AND t1.status = ?;",['0000-00-00',rolesList,'1']);
        const routersHtml = await new Promise((resolve, reject) => {
          ejs.renderFile(
            path.join(__dirname, 'views', 'partials', 'routers.ejs'),
            { folderStructure: cachedFolderStructure, user_details: check_lastLoginOfCookie, access_files: access_files, isRoot: true },
            (err, html) => {
              if (err) return reject(err);
              resolve(html);
            }
          );
        });
        req.quotes = check_lastLoginOfCookie[0];
        res.locals.routers = routersHtml;
      }
    }
    next();
  } catch (err) {
    console.error('Error rendering routers:', err);
    return res.status(500).json({ error: 'Error rendering routers' });
  }
});

// // Example API endpoint
// app.get('/api/data', (req, res) => {
//   // customer, shop, rate, date, logindetails, all schemes, customer schemes, schemes transations
//   res.json({ message: 'This is your API response' });
// });

// Routes
app.post('/upload-cropped-image', handleImageUpload);

// Generate dynamic routes based on folder structure
generateDynamicRoutes(app, path.join(__dirname, 'views/masters'));

// Use routes from separate files
app.use('/', require('./routes/pages'));
app.use('/profile', require('./routes/dev-scr/profile'));
app.use('/forgot-password', require('./routes/dev-scr/forgot-password'));
app.use('/home', require('./routes/dev-scr/home'));
app.use('/auth', require('./routes/auth'));
app.use('/api', require('./routes/api'));

// Socket.IO Logic
io.on('connection', (socket) => {
  // Get the token sent from the client
  const token = socket.handshake.headers.cookie;
  const parts = token ? token.split(`; userToken=`) : [];
  
  let cookieValue = null;
  if (parts.length === 2) {
    cookieValue = parts.pop().split(';').shift();
    
    // Update the status to '1' (Active) when the user connects
    backendCntrollers.updateQry(
      "UPDATE login_users SET status=?, statuswords=? WHERE deleteon=? AND cookie=?", 
      ['1', 'active', '0000-00-00', cookieValue]
    );
  }

  // Add user to the online users list
  onlineUsers[socket.id] = {
    socketId: socket.id,
    lastActive: 0,
    onlineActive:0,
    cookie: cookieValue
  };

  // Listen for user activity
  socket.on('user-active', () => {
    // console.log("hi activity ");
    if (onlineUsers[socket.id]) {
      onlineUsers[socket.id].onlineActive = Date.now();
      onlineUsers[socket.id].lastActive = null;
      if (cookieValue) {
        backendCntrollers.updateQry(
          "UPDATE login_users SET status=?, statuswords=? WHERE deleteon=? AND cookie=?", 
          ['1', 'active', '0000-00-00', cookieValue]
        );
      }
    }
  });

  // Listen for inactivity events
  socket.on('user-inactive', () => {
    // console.log("hi inactivity ");
    if (onlineUsers[socket.id]) {
      if(!onlineUsers[socket.id].lastActive)
        onlineUsers[socket.id].lastActive = Date.now();
      if (cookieValue) {
        backendCntrollers.updateQry(
          "UPDATE login_users SET status=?, statuswords=? WHERE deleteon=? AND cookie=?", 
          ['2', 'inactive', '0000-00-00', cookieValue]
        );
      }
    }
  });

  // Handle disconnection
  socket.on('user-disconnect', () => {
    // console.log("hi disconnectivity 222 ");
    if (onlineUsers[socket.id]) {
      backendCntrollers.updateQry(
        "UPDATE login_users SET status=?, statuswords=? WHERE deleteon=? AND cookie=?", 
        ['0', 'disconnect', '0000-00-00', cookieValue]
      );
      backendCntrollers.deleted({ body: {"tableName": "login_users", "whereCondition": "cookie=?","values":[cookieValue]}});
      delete onlineUsers[socket.id]; 
    }
  });
});

// Periodic check for inactive users (every 1 minute)
// setInterval(() => {
//   const now = Date.now();

//   Object.keys(onlineUsers).forEach((userId) => {
//     const user = onlineUsers[userId];
//     if (user && now - user.lastActive > 5 * 60 * 1000 && user.lastActive) {  // 5 minutes inactivity
//       if (user.cookie) {
//         backendCntrollers.updateQry(
//           "UPDATE login_users SET status=?, statuswords=? WHERE deleteon=? AND cookie=?", 
//           ['0', 'disconnect', '0000-00-00', user.cookie]
//         );
//       }
//       // Remove user from the tracking list after inactivity
//       backendCntrollers.deleted({ body: {"tableName": "login_users", "whereCondition": "cookie=?","values":[user.cookie]}});
//       delete onlineUsers[userId];
//     }
//   });
// }, 60000);  // Runs every 1 minute (60000ms)

// Start the server (using the HTTP server for Socket.IO)
server.listen(5001, () => {
  console.log("Server started on http://localhost:5000");
});
