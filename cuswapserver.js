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
  var inputPassword = req.body.uPassword;
  //HASH PASSWORD HERE
	//This query will return the user id of the user with username/pass combo that was entered on login page
  var loginquery1 = "SELECT user_id FROM \"user\" WHERE username='" + inputUsername + "' AND password='" + inputPassword + "';";

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

// create post page (navigating to)
app.get('/createpost', function(req, res) {
  var logIn = false; //if false, user is not logged in
  if(req.cookies) //user has cookies
  {
    if(req.session.user && req.cookies.user_sid) //if user has a session cookie and they are logged in
    {
      logIn = true; //they are logged in
    }
  }

  res.render(__dirname+'/templates/createpost.ejs',{ //sends the client the create post template
    pageTitle: "Create Post", //title of this page
    loggedIn: logIn //Change this based on a session cookie check
  });
});

//user has submitted a new post from the "create post" page
app.post('/createpost/submitPost', function(req, res) {
  if(req.session.user && req.cookies.user_sid) //check if user is logged in
  {
    var thisUser = req.session.user; //users id

    //Information from the "create post" form
    var inputTitle = req.body.postTitle;
    var inputDesc = req.body.postText;
    //If a checkbox was selected req.body.tag# will be TRUE (defined in createpost.ejs)
    var tag0 = req.body.tag0;
    var tag1 = req.body.tag1;
    var tag2 = req.body.tag2;
    var tag3 = req.body.tag3;
    var tag4 = req.body.tag4;
    var tag5 = req.body.tag5;
    var tag6 = req.body.tag6;
    ///If checkbox was not selected we have to manually set variable to false
    if(!tag0){tag0 = "FALSE";}
    if(!tag1){tag1 = "FALSE";}
    if(!tag2){tag2 = "FALSE";}
    if(!tag3){tag3 = "FALSE";}
    if(!tag4){tag4 = "FALSE";}
    if(!tag5){tag5 = "FALSE";}
    if(!tag6){tag6 = "FALSE";}

    //SQL to insert the new post into the database
    var cpquery1 = 'INSERT INTO "post" (post_title, post_body, tag_array, poster_id, complete) VALUES(\''+ inputTitle +'\', \''+ inputDesc +'\', ARRAY ['+ tag0 +','+ tag1 +','+ tag2 +','+ tag3 +','+ tag4 +','+ tag5 +','+ tag6 +'], '+ thisUser +', FALSE);';

    db.task('get-everything', task => {
        return task.batch([
            task.any(cpquery1),
        ]);
    })
    .then(data => {
        res.redirect('/createpost'); //go back to create post after the post is added to the database
    })
    .catch(error => { //shouldn't (hopefully) be able to get an error for this query due to the way inputs are set
        // display error message in case an error
            console.log(error);
            res.redirect('/createpost');
    });
  }
  else //user was not logged in
  {
    res.redirect('/login'); //redirect to login page since not logged in
  }
});

// register page (navigating to)
app.get('/register', function(req, res) {
  var logIn = false; //if false, user is not logged in
  if(req.cookies) //user has cookies
  {
    if(req.session.user && req.cookies.user_sid) //if user has a session cookie and they are logged in
    {
      logIn = true; //they are logged in
    }
  }

  if(logIn) //if logged in
  {
    res.redirect('/homepage'); //redirect to home page since already have an account and logged in
  }
  else //not logged in
  {
    res.render(__dirname+'/templates/register.ejs',{ //sends the client the register template
      pageTitle: "Register", //title of this page
      loggedIn: logIn //Change this based on a session cookie check
    });
  }
});

//user is trying to create a new account
app.post('/register/submitRegister', function(req, res) {
  if(!(req.session.user && req.cookies.user_sid)) //make sure user is not logged in already
  {
    //NOTE: we should check that password/confirm password matched clientside and only enable the submit button then
    //Information from the "register" form
    var newName = req.body.uName;
    var newPass = req.body.uPassword;
    //HASH PASSWORD HERE

    //SQL to insert the new user into the database
    var regquery1 = "INSERT INTO \"user\" (username, password) VALUES('"+ newName +"', '"+ newPass +"');";

    db.task('get-everything', task => {
        return task.batch([
            task.any(regquery1),
        ]);
    })
    .then(data => {
        res.redirect('/login'); //go back to create post after the post is added to the database
    })
    .catch(error => { //shouldn't (hopefully) be able to get an error for this query due to the way inputs are set
        // display error message in case an error
            console.log(error);
            res.redirect('/register');
    });
  }
  else //user is logged in (already has an account)
  {
    res.redirect('/homepage'); //redirect to homepage
  }
});

app.get('/profile', function(req,res){
  var logIn = true; //if false, user is not logged in
  if(req.cookies) //user has cookies
  {
    if(req.session.user && req.cookies.user_sid) //if user has a session cookie and they are logged in
    {
      logIn = true; //they are logged in
    }
  }

  var query1;
  if(logIn==true){
    res.render(__dirname+'/templates/userProfile.ejs',{
      pageTitle: "Profile",
      loggedIn: logIn
    }
  );
  }else{
    res.redirect('/login')
  }
});

app.use(function (req, res, next) {
  res.status(404).send("Page not found")
});

app.listen(8080);
console.log('listening on port 8080');
