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

app.get('/post_page',function(req,res){
  var postID = req.query.id  //get postid
  if(req.session.user && req.cookies.user_sid) //check if user is logged in
  {
    
    var query1 = "SELECT post_title FROM \"post\" WHERE post_id = "+postID+";";
        //Use get request in the server file and the post 
    //you are navigating to will be an agrument in the URL
    db.task('get-everything', task => {
        return task.batch([
            task.any(query1), //Grabs post_title
        ]);
    })
    .then(data => {
        res.render(__dirname+'post_page.ejs',{
          pageTitle: "post_title",
          loggedIn: logIn,
          posts: data[0],
          current: data[1][0],
          messages:data[2],
          allUsers: uniqueMessages,
          userInfo: data[3],
        }
      );
    })
    //loads the particular post 
    .catch(error => { //shouldn't (hopefully) be able to get an error for this query due to the way inputs are set
        // display error message in case an error
            console.log(error);
            res.redirect('/homepage');
    });
  }
  else //user was not logged in
  {
    res.redirect('/login'); //redirect to login page since not logged in
  }
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

function register(){
  alert("Working Function Check")
  var myInput = document.getElementById("psw");
  var confirmMyInput = document.getElementById("cpsw");
  var letter = document.getElementById("letter");
  var number = document.getElementById("number");
  var capital = document.getElementById("capital");
  var length = document.getElementById("length");
  var match = document.getElementById("match");
  var button = document.getElementById('my_submit_button');

  myInput.onkeyup = function(){
    var lowercaseletters = /[a-z]/g;
    var uppercaseletters = /[A-Z]/g;
    var numbers = /[0-9]/g;
    var minlength = 8;

    if (myInput.value.match(lowercaseletters)){
      letter.classList.remove("invalid");
      letter.classList.add("valid");
    }
    else {
      letter.classList.remove("valid");
      letter.classList.add("invalid");
    }
    if (myInput.value.match(uppercaseletters)){
      capital.classList.remove("invalid");
      capital.classList.add("valid");
    }
    else {
      capital.classList.remove("valid");
      capital.classList.add("invalid");
    }
    if (myInput.value.match(numbers)){
      number.classList.remove("invalid");
      number.classList.add("valid");
    }
    else {
      number.classList.remove("valid");
      number.classList.add("invalid");
    }
    if (myInput.value.length >= minlength){
      length.classList.remove("invalid");
      length.classList.add("valid");
    }
    else {
      length.classList.remove("valid");
      length.classList.add("invalid");
    }
  }
  confirmMyInput.onkeyup= function(){
    if(myInput.value == confirmMyInput.value){
      var passequalsconfpass = (true);
    }
    else{
      var passequalsconfpass = (false);
    }
    if (passequalsconfpass){
      match.classList.remove("invalid");
      match.classList.add("valid");
    }
    else{
      match.classList.remove("valid");
      match.classList.add("valid");
    }
  }
  requirementsMet.onkeyup = function(){
    if (letter.classList.contains("valid") && capital.classList.contains("valid") && number.classList.contains("valid") && length.classList.contains("valid") && match.classList.contains("valid")){
      button.classList.remove("invalid");
      button.classList.add("valid");
    }
    else{
      button.classList.remove("valid");
      button.classList.add("invalid");
    }
  }
}

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

function isThere(p1,index){ //Function checks whether a new user exists yet in the array
  for(var i=0;i<p1.length;i++){
    if(index==p1[i])
      return true;
  }
  return false;
}
function identifyUnique(info){ //Finds all the unique messages based off of user_id
  var hasSeen=[];
  for(var i=0;i<info.length;i++){
    if(!isThere(hasSeen,info[i].from_user)){
      hasSeen.push(info[i].from_user);
    }
  }
  return hasSeen;
}
app.get('/userProfile', function(req,res){
  var logIn = false; //if false, user is not logged in
  var userId; //Keeps track of current user's ID
  var uniqueMessages; //Counts the total of unique users in messages
  if(req.cookies) //user has cookies
  {
    if(req.session.user && req.cookies.user_sid) //if user has a session cookie and they are logged in
    {
      logIn = true; //they are logged in
      userId=req.session.user;
    }
  }

  var query1 = "SELECT * FROM \"post\" WHERE poster_id="+userId+";";
  var query2 = "SELECT * FROM \"user\" WHERE user_id="+userId+";";
  var query3 ="SELECT * FROM \"messages\" WHERE from_user = " + userId + " OR to_user = " + userId + " ORDER BY combo_id, message_id DESC;";
  var query4 = "SELECT * FROM \"user\";";
  if(logIn){
    db.task('get-everything', task => {
        return task.batch([
            task.any(query1),
            task.any(query2),
            task.any(query3), //Grabs the messages in descending ORDER
            task.any(query4), //Grabs all the users so we can display the name of each person
        ]);

    })
    .then(data => {
      if(data[0]){;
        uniqueMessages = identifyUnique(data[2]);
        console.log(data[1][0]);
        res.render(__dirname+'/templates/userProfile.ejs',{
          pageTitle: "Profile",
          loggedIn: logIn,
          posts: data[0],
          current: data[1][0],
          messages:data[2],
          allUsers: uniqueMessages,
          userInfo: data[3],
        }
      );
      }
    })
    .catch(error => { //shouldn't (hopefully) be able to get an error for this query due to the way inputs are set
        // display error message in case an error
            console.log(error);
          //  res.redirect('/homepage');
    });


  }else{
    res.redirect('/login')
  }
});

function orderComboId(from,to){ //Orders combo ID based off of smallest value
  if(to > from){
    return from+"_"+to;
  }
  return to+"_"+from;
}
function isEmpty(text){ //Checks if the textbox is empty; If empty return true: Not empty return false;
  console.log(text);
  if(text.length != 0)
    return false;
  return true;
}
app.post('/userProfile/submitReply', function(req, res) {
  if(req.session.user && req.cookies.user_sid) //make sure user is not logged in already
  {
    var textInfo = req.body.replyText;
    var from = req.session.user;
    var to = req.body.toUserId;
    var comboValue = orderComboId(from,to);
    var query1 = "INSERT INTO \"messages\" (from_user, to_user, message_body, combo_id) VALUES('"+ from +"', '"+ to +"', '"+textInfo+"', '"+comboValue+"');";
    db.task('get-everything', task => {
        return task.batch([
            task.any(query1),
        ]);
    })
    .then(data => {
      if(!isEmpty(textInfo)){

      }else{

      }
        res.redirect('/userProfile'); //go back to create post after the post is added to the database

    })
    .catch(error => { //shouldn't (hopefully) be able to get an error for this query due to the way inputs are set
        // display error message in case an error
            console.log(error);

    });
  }
  else //user is logged in (already has an account)
  {
    res.redirect('/homepage'); //redirect to homepage
  }
});

app.use(function (req, res, next) {
  res.status(404).send("Page not found")
});

app.listen(8080);
console.log('listening on port 8080');
