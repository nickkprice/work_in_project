/*check if user exists nodejs sql query*/
var findUser = "SELECT * FROM \"user\" WHERE username = '" + username_variable + "';";
/*find users posts nodejs sql query*/
var findUserPosts = "SELECT * FROM \"post\" WHERE username = '" + username_variable + "';";
/*sign in nodejs sql query*/
var signin = "SELECT * FROM \"user\" WHERE username = '" + username_variable + "' AND password = '" + password_variable + "';";
/*new filter query nodejs sql*/
var newFilter = "SELECT * FROM \"post\" WHERE complete = FALSE ORDER BY time_created DESC;";
/*any filter other than just new nodejs sql*/
var inputArray = [0,0,0,0,0,0,0];
var query = "SELECT * FROM \"post\" WHERE complete = FALSE ";
if(inputArray[0] == 1){
  query += "AND tag_array[1] = TRUE ";
}
if(inputArray[1] == 1){
  query += "AND tag_array[2] = TRUE ";
}
if(inputArray[2] == 1){
  query += "AND tag_array[3] = TRUE ";
}
if(inputArray[3] == 1){
  query += "AND tag_array[4] = TRUE ";
}
if(inputArray[4] == 1){
  query += "AND tag_array[5] = TRUE ";
}
if(inputArray[5] == 1){
  query += "AND tag_array[6] = TRUE ";
}
if(inputArray[6] == 1){
  query += "AND tag_array[7] = TRUE ";
}
query += "ORDER BY time_created DESC;";
/*this should be the message syntax i think*/
var messageQuery = "SELECT * FROM \"messages\" WHERE from_user = " + user_id + " OR to_user = " + user_id + " ORDER BY combo_id, message_id DESC;"
