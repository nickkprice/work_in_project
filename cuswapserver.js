//Some code adapted from CSCI 3308 NodeJS Lab

/***********************

  Load Components!

  Express      - A Node.js Framework
  Body-Parser  - A tool to help use parse the data in a post request
  Pg-Promise   - A database tool to help use connect to our PostgreSQL database

***********************/

const express = require('express'); // Add the express framework has been added
let app = express();

const bodyParser = require('body-parser'); // Add the body-parser tool has been added
var expressSanitized = require('express-sanitize-escape');
app.use(bodyParser.json());              // Add support for JSON encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // Add support for URL encoded bodies
app.use(expressSanitized.middleware());

//Create Database Connection
const pgp = require('pg-promise')();

const bcrypt = require('bcrypt'); //used for password hashing


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

//visiting root of website
app.get('/', function(req, res) { //going to root of website
    res.redirect('/homepage'); //redirects to homepage
});

// home page
app.get('/homepage', function(req, res) {
  var logIn = false; //if false, user is not logged in
  if(req.cookies) //user has cookies
  {
    if(req.session.user && req.cookies.user_sid) //if user has a session cookie and they are logged in
    {
      logIn = true; //they are logged in
    }
  }

  var posts_query = "SELECT * FROM \"post\" WHERE complete = FALSE ORDER BY date_created DESC,time_created DESC;";
  var username_query = "SELECT username FROM \"user\" INNER JOIN \"post\" ON poster_id = user_id WHERE complete = FALSE ORDER BY date_created DESC,time_created DESC;";

  db.task('get-posts', task => {
    return task.batch([
      task.any(posts_query),
      task.any(username_query),
    ]);
  })
  .then(data => {
    //console.log(data);
    res.render(__dirname+'/templates/homepage.ejs',{
      pageTitle: "Home",
      loggedIn: logIn,
      posts: data[0],
      usernames: data[1]
    }
  )
  })
  .catch(error => { //shouldn't (hopefully) be able to get an error for this query due to the way inputs are set
  // display error message in case an error
      console.log(error);
      res.redirect('/homepage');
});
  ;
});

//user has selected a filter
app.post('/homepage/filter', function(req, res) {
  var logIn = false; //if false, user is not logged in
  if(req.cookies) //user has cookies
  {
    if(req.session.user && req.cookies.user_sid) //if user has a session cookie and they are logged in
    {
      logIn = true; //they are logged in
    }
  }

    //If a checkbox was selected req.body.tag# will be TRUE (defined in homepage.ejs)
    var tag0 = req.body.tag0;
    var tag1 = req.body.tag1;
    var tag2 = req.body.tag2;
    var tag3 = req.body.tag3;
    var tag4 = req.body.tag4;
    var tag5 = req.body.tag5;
    var tag6 = req.body.tag6;

    var filterQuery = "SELECT * FROM \"post\" WHERE complete = FALSE ";
    var username_query = "SELECT username FROM \"user\" INNER JOIN \"post\" ON poster_id = user_id WHERE complete = FALSE ";
    if(tag0){filterQuery += "AND tag_array[1] = TRUE "; username_query += "AND tag_array[1] = TRUE ";}
    if(tag1){filterQuery += "AND tag_array[2] = TRUE "; username_query += "AND tag_array[2] = TRUE ";}
    if(tag2){filterQuery += "AND tag_array[3] = TRUE "; username_query += "AND tag_array[3] = TRUE ";}
    if(tag3){filterQuery += "AND tag_array[4] = TRUE "; username_query += "AND tag_array[4] = TRUE ";}
    if(tag4){filterQuery += "AND tag_array[5] = TRUE "; username_query += "AND tag_array[5] = TRUE ";}
    if(tag5){filterQuery += "AND tag_array[6] = TRUE "; username_query += "AND tag_array[6] = TRUE ";}
    if(tag6){filterQuery += "AND tag_array[7] = TRUE "; username_query += "AND tag_array[7] = TRUE ";}

    filterQuery += "ORDER BY date_created DESC,time_created DESC;";
    username_query += "ORDER BY date_created DESC,time_created DESC;";
    db.task('get-everything', task => {
        return task.batch([
            task.any(filterQuery),
            task.any(username_query),
        ]);
    })
    .then(data => {
      res.render(__dirname+'/templates/homepage.ejs',{
        pageTitle: "Home",
        loggedIn: logIn,
        posts: data[0],
        usernames: data[1],
    })
  })
    .catch(error => { //shouldn't (hopefully) be able to get an error for this query due to the way inputs are set
        // display error message in case an error
            console.log(error);
            res.redirect('/homepage');
    });
  });

app.post('/homepage/search', function(req, res) {
  var logIn = false; //if false, user is not logged in
  if(req.cookies) //user has cookies
  {
    console.log("User has cookies");
    if(req.session.user && req.cookies.user_sid) //if user has a session cookie and they are logged in
    {
      logIn = true; //they are logged in
    }
  }

  var searchInput = req.body.searchButton;
  var filterQuery = "SELECT * FROM \"post\" WHERE post_title ILIKE '%"+ searchInput +"%' AND complete = FALSE ORDER BY date_created DESC,time_created DESC;";
  var username_query = "SELECT username FROM \"user\" INNER JOIN \"post\" ON poster_id = user_id WHERE post_title ILIKE '%"+ searchInput +"%' AND complete = FALSE ORDER BY date_created DESC,time_created DESC;";

db.task('get-everything', task => {
    return task.batch([
        task.any(filterQuery),
        task.any(username_query),
    ]);
})
.then(data => {
  res.render(__dirname+'/templates/homepage.ejs',{
    pageTitle: "Home",
    loggedIn: logIn,
    posts: data[0],
    usernames: data[1],
})
})

.catch(error => { //shouldn't (hopefully) be able to get an error for this query due to the way inputs are set
    // display error message in case an error
        console.log(error);
        res.redirect('/homepage');
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

	//This query will return the user id of the user with username/pass combo that was entered on login page
  var loginquery1 = "SELECT user_id,password FROM \"user\" WHERE username='" + inputUsername + "';";

  db.task('get-everything', task => {
      return task.batch([
          task.any(loginquery1),
      ]);
  })
  .then(data => {
    //compares stored password with input password
    if(data[0][0])
    {
      bcrypt.compare(inputPassword, data[0][0].password, function(err, match) {
        if(match) //they match
        {
          console.log("Authenticated user " + data[0][0].user_id); //user with this id is logging in successfully
          req.session.user = data[0][0].user_id; //sets their user session to be their user id, proves they logged in
          res.redirect('/homepage'); //go to homepage
        }
        else //failed login
        {
          res.redirect('/login'); //go back to login page if their credentials weren't correct
        }
      });
    }
    else
    {
      res.redirect('/login');
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
  if(!logIn)
  {
    res.redirect('/login');
  }
  else
  {
    res.render(__dirname+'/templates/createpost.ejs',{ //sends the client the create post template
      pageTitle: "Create Post", //title of this page
      loggedIn: logIn //Change this based on a session cookie check
    });
  }
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
    //Information from the "register" form
    var newName = req.body.uName;
    var newPass = req.body.uPassword;
    bcrypt.hash(newPass, 10, function(err, hash) {
    newPass = hash;


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

  var query1 = "SELECT * FROM \"post\" WHERE poster_id="+userId+" ORDER BY date_created DESC,time_created DESC;";
  var query2 = "SELECT * FROM \"user\" WHERE user_id="+userId+";";
  var query3 ="SELECT * FROM \"messages\" WHERE from_user = " + userId + " OR to_user = " + userId + " ORDER BY combo_id, message_id ASC;";
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
        //console.log(data[1][0]);
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
  //console.log(text);
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

app.get('/viewPost',function(req,res){ //viewing a post
  var postID = req.query.id;  //get postid from url
  var logIn = false;
  if(req.session.user && req.cookies.user_sid) //check if user is logged in
  {
    logIn = true;
  }
    var postQuery1 = "SELECT * FROM \"post\" WHERE post_id = "+postID+";"; //find the post
    var postQuery2 = "SELECT username FROM \"user\";"; //all usernames

    db.task('get-everything', task => {
        return task.batch([
            task.any(postQuery1), //Grabs post info
            task.any(postQuery2) //Grabs list of all usernames
        ]);
    })
    .then(data => { //loads the particular post
        var tagArray = [];
        var tagNames = ["Food","Furniture","Clothes","Toys & Games","Services","Technology","Other"];
        for(var i in data[0][0].tag_array) //creates an array of the tags that the post has
        {
          if(data[0][0].tag_array[i] == true)
          {
            tagArray.push(tagNames[i]);
          }
        }
        res.render(__dirname+'/templates/post_page.ejs',{
          pageTitle: data[0][0].post_title, //page title will be the post title
          loggedIn: logIn, //user is logged in
          post: data[0][0], //post info
          postOwner: data[1][data[0][0].poster_id - 1].username, //name of the poster
          tagArray: tagArray, //array of tags for this post
          thisUser: req.session.user
        }
      );
    })
    .catch(error => {
        // display error message in case an error
            console.log(error);
            console.log("VIEW POST ERROR");
            res.redirect('/homepage');
    });
});

app.post('/viewPost/submitReport', function(req, res) { //reporting a post
  if(req.session.user && req.cookies.user_sid) //make sure user is logged in
  {
    var reportText = "Report regarding post id " + req.body.postId + ": " + req.body.reportText;
    var from = req.session.user;
    var to = 1;
    var comboValue = orderComboId(from,to);
    var query1 = "INSERT INTO \"messages\" (from_user, to_user, message_body, combo_id) VALUES('"+ from +"', '"+ to +"', '"+reportText+"', '"+comboValue+"');";
    db.task('get-everything', task => {
        return task.batch([
            task.any(query1),
        ]);
    })
    .then(data => {
      res.redirect('/homepage');
    })
    .catch(error => {
        // display error message in case an error
          console.log(error);
          res.redirect('/homepage');
    });
  }
  else //not logged in
  {
    res.redirect('/homepage');
  }
});

app.post('/viewPost/submitReply', function(req, res) { //replying to post
  if(req.session.user && req.cookies.user_sid) //make sure user is logged in
  {
    var replyText = req.body.replyText;
    var from = req.session.user;
    var to = req.body.toUserId;
    var comboValue = orderComboId(from,to);
    var query1 = "INSERT INTO \"messages\" (from_user, to_user, message_body, combo_id) VALUES('"+ from +"', '"+ to +"', '"+replyText+"', '"+comboValue+"');";
    db.task('get-everything', task => {
        return task.batch([
            task.any(query1),
        ]);
    })
    .then(data => {
      res.redirect('/viewPost/?id=' + req.body.postId);
    })
    .catch(error => {
        // display error message in case an error
          console.log(error);
          res.redirect('/homepage');
    });
  }
  else //not logged in
  {
    res.redirect('/homepage');
  }
});

app.post('/viewPost/archive',function(req,res){ //archive a post
  var postID = req.body.postID;  //get post id
  var posterID = req.body.posterID;  //get id of post owner
  var logIn = false;
  if(req.session.user && req.cookies.user_sid) //check if user is logged in
  {
    logIn = true;
  }

  if(logIn && req.session.user == posterID)
  {
    var archiveQuery1 = "UPDATE \"post\" SET complete = TRUE WHERE post_id = "+postID+";"; //find the post

    db.task('get-everything', task => {
        return task.batch([
            task.any(archiveQuery1), //Sets post as completed (archives it)
        ]);
    })
    .then(data => { //loads the particular post
      res.redirect('/viewPost/?id=' + postID);
    })
    .catch(error => {
        // display error message in case an error
            console.log(error);
            res.redirect('/homepage');
    });
  }
  else
  {
    res.redirect('/homepage');
  }
});

app.use(function (req, res, next) {
  res.status(404).send("Page not found")
});

app.listen(8080);
console.log('listening on port 8080');
