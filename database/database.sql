CREATE TABLE IF NOT EXISTS "user" (
    user_id      SERIAL PRIMARY KEY, /*unique id for each user*/
    username     VARCHAR(50),        /*the username of the user*/
    password     VARCHAR(500),       /*the encrypted password*/
    cookie       INT NOT NULL /*cookie (the lazy way until i figure out how to do it better)*/
);

    /*users_msgd   INT[] REFERENCES "user"(user_id), /*the table of users messaged*/
    user_msgs    varchar(2000)[][] /*the 2d array of messages that have been sent*/temporarily disabled to wait to figure out how to do this*/

/* currently is an issue*/ ALTER TABLE "user" ADD posts INT[] REFERENCES "post"(post_id); /*ids of the posts to be referenced (i think thats how youd do an array in this context)*/

CREATE TABLE IF NOT EXISTS "post" (
    post_id      SERIAL PRIMARY KEY, /*unique id for each post*/
    post_title   VARCHAR(500), /*title of the post*/
    post_body    VARCHAR(500), /*the body of the post*/
    date_created DATE NOT NULL DEFAULT CURRENT_DATE, /*the current date that the post is made*/
    tag_array    BOOLEAN[7] NOT NULL, /*the array that stores the tags to filter by*/
    poster_id    INT REFERENCES "user"(user_id), /*this references back to the account that created it*/
    complete     BOOLEAN NOT NULL /*if the deal is complete*/
);

INSERT INTO "user" (username, password, cookie)
VALUES('SeerOfDreams', 'Password123', 12345),
('b0b123', 'lookapassword', 123456),
('u53r', 'p455w0rd', 123457),
('fun', 'wordthatpasses', 123458),
('ugh', 'thiswordpasses', 123459),
('u53r1', 'w0rdth4tp45535', 123460)
;

INSERT INTO "post" (post_title, post_body, tag_array, poster_id, complete)
VALUES('car', 'this is car for sale', ARRAY [FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,TRUE], 2, FALSE),
('free food', 'is food', ARRAY [TRUE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE], 3, FALSE),
('old clothes', 'fhkjafbahkdv', ARRAY [FALSE,FALSE,TRUE,FALSE,FALSE,FALSE,FALSE], 4, TRUE),
('old furniture', 'dxfcgvhbjkn', ARRAY [FALSE,TRUE,FALSE,FALSE,FALSE,FALSE,FALSE], 4, FALSE),
('free edible clothes', 'is food', ARRAY [TRUE,FALSE,TRUE,FALSE,FALSE,FALSE,FALSE], 3, FALSE)
;

SELECT * FROM "user" WHERE username = 'SeerOfDreams' AND cookie = 12345; /*later replace SeerOfDreams with a username variable and cookie with a variable too*/

CREATE VIEW new_filter AS SELECT * FROM post WHERE complete = FALSE ORDER BY date_created DESC;

CREATE VIEW food_filter AS SELECT * FROM post WHERE complete = FALSE AND tag_array[1] = TRUE ORDER BY date_created DESC; /*maybe it's ASC i have to test*/



/*do the ids start at 0 or 1?????*/
/*'this is a message','look im messaging another user']['look a response']), ik im doing the 2d array wrong so well need to work on that in the future*/
