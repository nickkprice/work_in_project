/***********************

  Load Components!

  Express      - A Node.js Framework
  Body-Parser  - A tool to help use parse the data in a post request
  Pg-Promise   - A database tool to help use connect to our PostgreSQL database

***********************/

const express = require('express'); // Add the express framework has been added
let app = express();

const bodyParser = require('body-parser'); // Add the body-parser tool has been added
app.use(bodyParser.json());              // Add support for JSON encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // Add support for URL encoded bodies

//Create Database Connection
const pgp = require('pg-promise')();


/**********************

  Database Connection information

  host: This defines the ip address of the server hosting our database.  We'll be using localhost and run our database on our local machine (i.e. can't be access via the Internet)
  port: This defines what port we can expect to communicate to our database.  We'll use 5432 to talk with PostgreSQL
  database: This is the name of our specific database.
  user: This should be left as postgres, the default user account created when PostgreSQL was installed
  password: This the password for accessing the database.  You'll need to set a password USING THE PSQL TERMINAL THIS IS NOT A PASSWORD FOR POSTGRES USER ACCOUNT IN LINUX!

**********************/
// NOTE: don't use a real password if pushing to GitHub

const dbConfig = {
	host: 'localhost',
	port: 5432,
	database: 'cuswap_db', //name of the sql database
	user: 'postgres',
	password: 'pass'
};

let db = pgp(dbConfig);

app.use(express.static(__dirname + '/')); // This line is necessary for us to use relative paths and access our resources directory
app.set('view engine', 'ejs'); //using this view engine to res.sendFile html pages
app.engine('html', require('ejs').renderFile);
var ejs = require('ejs');
var fs = require('fs');
var cookieParser = require('cookie-parser');
app.use(cookieParser());
var session = require('express-session');

app.use(session({
    key: 'user_sid', //name of cookie, user session id
    secret: '9f4d3cg5j1j6n15kqvs8', //random string used to "sign" cookies
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000 //10 minutes
    }
}));

// This middleware will check if user's cookie is still saved in browser and user is not set, then automatically log the user out.
// This usually happens when you stop your express server after login, your cookie still remains saved in the browser.
app.use((req, res, next) => {
  if(req.cookies)
  {
    if(req.cookies.user_sid && !req.session.user)
    {
      res.clearCookie('user_sid');
    }
  }
  next();
});


// home page
app.get('/homepage', function(req, res) {
  var logIn = false; //if false, user is not logged in
  console.log("User: " + req.session.user); //will say undefined if user not logged in, otherwise says their user_id
  if(req.cookies) //user has cookies
  {
    console.log("User has cookies");
    if(req.session.user && req.cookies.user_sid) //if user has a session cookie and they are logged in
    {
      logIn = true; //they are logged in
    }
  }
  else
  {
    console.log("no cookies");
  }

  res.render(__dirname+'/templates/homepage.ejs',{ //sends the client the homepage template
    pageTitle: "Home", //title of this page
    loggedIn: logIn //Change this based on a session cookie check
  });
});

//login page
app.get('/login', function(req, res) {
  var logIn = false; //see comments in home page get request for explanation
  if(req.cookies)
  {
    if(req.session.user && req.cookies.user_sid)
    {
      logIn = true;
    }
  }
  if(!logIn) //user not logged in
  {
    res.render(__dirname+'/templates/login.ejs',{ //render login page
      pageTitle: "Login",
      loggedIn: logIn
    });
  }
  else
  {
    res.redirect('/homepage'); //redirect to homepage if user is already logged in
  }
});

//user has submitted login data and wants to be authenticated
app.post('/login/submitLogin', function(req, res) {
  var inputUsername = req.body.uName;
  var inputPassword = req.body.uPassword
  //HASH PASSWORD HERE
	//This query will return the user id of the user with username/pass combo that was entered on login page
  var loginquery1 = 'SELECT user_id FROM "user" WHERE username=\'' + inputUsername + '\' AND password=\'' + inputPassword + '\';';

  db.task('get-everything', task => {
      return task.batch([
          task.any(loginquery1),
      ]);
  })
  .then(data => {
		//Result of query:
		// console.log(data[0][0]);
		if(data[0][0]) //if user with that user/pass combo was found by sql query
		{
			console.log("Authenticated user " + data[0][0].user_id); //user with this id is logging in successfully
      req.session.user = data[0][0].user_id; //sets their user session to be their user id, proves they logged in
      res.redirect('/homepage'); //go to homepage
		}
		else //failed login
		{
      res.redirect('/login'); //go back to login page if their credentials weren't correct
		}

  })
  .catch(error => {
      // display error message in case an error
          console.log(error);
          res.redirect('/login');
  });
});

// log out user
app.get('/logout', function(req, res) {
  if(req.cookies)
  {
    if(req.session.user && req.cookies.user_sid) //if logged in
    {
      res.clearCookie('user_sid'); //clearing their cookies will log them out
    }
  }
  res.redirect('/homepage'); //go to homepage no matter what
});

app.use(function (req, res, next) {
  res.status(404).send("Page not found")
});

app.listen(8080);
console.log('listening on port 8080');
