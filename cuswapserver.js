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

// home page
app.get('/homepage', function(req, res) {
	res.sendFile(__dirname+'/views/homepage.html',{ //sends the client the homepage file from the views folder
	});
});

//login page
app.get('/login', function(req, res) {
	res.sendFile(__dirname+'/views/login.html',{
	});
});

app.post('/login/submitLogin', function(req, res) {
  var inputUsername = req.body.uName;
  var inputPassword = req.body.uPassword;
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

    //need to generate a cookie and send to user

    // fs.readFile(__dirname + '/views/homepage.html', 'utf-8', (err, html) => {
    //   res.send(ejs.render(html, JSON.stringify(loggedIn)))
    //The above code works but will not redirect to homepage url, it merely stays on login/submitLogin and renders homepage

		if(data[0][0]) //if user with that user/pass combo was found by sql query
		{
			console.log("Authenticated");
			var loggedIn = true;
			res.sendFile(__dirname+'/views/homepage.html',{ //stays on login/submitLogin url, need to redirect instead?
				//also need to be able to send the loggedIn variable to homepage which will be used by clientside JS
			});
		}
		else //failed login
		{
			res.sendFile(__dirname+'/views/login.html',{
			});
		}

  })
  .catch(error => {
      // display error message in case an error
          console.log(error);
          res.sendFile(__dirname+'/views/login.html',{
  		});
  });
});

// testing ejs templates
app.get('/test1', function(req, res) {
  var displayWord = "Hello World!";
	res.render(__dirname+'/templates/homepage.ejs',{ //sends the client the homepage template
    newTitle: displayWord
	});
});


app.listen(8080);
console.log('listening on port 8080');
