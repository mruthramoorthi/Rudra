const fs = require('fs');
const path = require('path');
const userController = require('./controllers/users');
const backendCntrollers = require('./controllers/backend-functions');

// Function to generate dynamic routes
const generateDynamicRoutes = (app, basePath, currentPath = '/masters') => {
  const files = fs.readdirSync(basePath);
  files.forEach(file => {
    const fullPath = path.join(basePath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      generateDynamicRoutes(app, fullPath, `${currentPath}/${file}`);
    } else if (file.endsWith('.hbs')) {
      const routePath = `${currentPath}/${file.replace('.hbs', '')}`;
      
      app.get(routePath, userController.isLoggedIn, async (req, res) => {
        req.session.routePath=routePath;
        try {
          if (req.user) {
            const logData = {
              cookie: req.user.cookie,
              user_id: req.user.name,
              user_uniqueid: req.user.userid,
              rights: req.user.rights,
              page_name: routePath,
            };

            await backendCntrollers.insert({
              body: {
                tableName: 'page_access_logs',
                data: logData,
              }
            }, res);

            const routesPath = path.join(__dirname, 'routes/dev-scr');
            try {
                  let rights = null; // Initialize rights to avoid undefined reference

                  if (fs.existsSync(routesPath + "/" + file.replace('.hbs', '.js'))) {
                      const route = require(path.join(routesPath, `${file.replace('.hbs', '.js')}`));
                      app.use(`/${file.replace('.hbs', '')}`, route);
                  }

                  const results = await backendCntrollers.selectQuery("select * from login_users where deleteon=? and userid=? and site=? order by uniqueid desc", ['0000-00-00', req.user.userid, global.userToken.site]);
                  const branches = await backendCntrollers.selectQuery("select * from user_roles where deleteon=? and userid=? and branches=? order by uniqueid desc", ['0000-00-00', req.user.userid, global.userToken.site]);
                  const roles = branches.map(item => item.roles);  // Extract roles
                  const page = await backendCntrollers.selectQuery("select * from page_access_logs where deleteon=? and user_uniqueid=? and rights=? and branch=? order by uniqueid desc", ['0000-00-00', req.user.userid, results[0].rights, results[0].site]);
                  if (page[0]) {
                      const pagePath = page[0].page_name.replaceAll('/masters', '').replaceAll("/", "\\") + ".hbs";
                      rights = await backendCntrollers.selectQuery("select * from page_feature_rights where deleteon=? and path=? and role in (?) order by uniqueid desc", ['0000-00-00', pagePath, roles]);
                      if (rights && rights.length > 0) {
                          results[0] = { ...results[0], rights_result: rights };  // Merges the rights object into req.user
                      }
                  }
                  global.userToken = results[0];
                  // Ensure rights is always defined (or null if not found)
                  res.render(`${routePath.slice(1)}`, { user: results[0], rights: rights ? rights : null });
            } catch (err) {
              console.error(`Error requiring route for ${file}:`, err);
              res.status(500).redirect('/404');
            }
          } else {
            res.status(500).redirect('/404');
          }
        } catch (error) {
          console.error('Error handling request for dynamic route:', error);
          res.status(500).send('Error processing your request');
        }
      });
    }
  });
};

module.exports = { generateDynamicRoutes };
