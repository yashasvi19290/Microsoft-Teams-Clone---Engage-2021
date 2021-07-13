/*

    Microsoft Teams Clone - Engage'21
    ---------------------------------
    Submitted By: Yashasvi Chhabra [yashasvi19290@iiitd.ac.in]

    References:
    https://levelup.gitconnected.com/building-a-video-chat-app-with-node-js-socket-io-webrtc-26f46b213017


*/


//Setting up a Web Server
const express = require("express");
const app = express();
const server = require("http").Server(app);

//Initializing a new instance of 'socket.io' to enable real-time communication between server and client
const { Server } = require("socket.io");
const io = new Server(server);

//Initilizing a new instance of 'uuid' version 4 to generate a unique ID for every call
const { v4: uuidv4} = require("uuid");

//Other variables
const bodyParser = require("body-parser");

//Setting app properties
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.json());

//Routing methods to respond to client requests

//Landing Page
app.get("/", (request, response) => {
    response.render("landing-page.ejs");
});

//Initiate New Call: Generates a UUID and redirects to it 
//(as executed by Route Path = "/:ID" below)
app.get("/new", (request, response) => {
    response.redirect(`/${uuidv4()}`);
});

//Join Existing Call: Takes the Call ID from the client and redirects to it 
//(as executed by Route Path = "/:ID" below)
app.post("/join", (request, response) => {
    var callID = request.body.ID;
    response.redirect(`/${callID}`);
})

//End Call: Takes the Call ID from the client and redirects to the specified call's end page 
//(as executed by Route Path = "/end-:ID" below)
app.post("/end", (request, response) => {
    var callID = request.body.ID;
    response.redirect(`/end-${callID}`);
});

//End Call for a particular Call ID
app.get("/end-:ID", (request, response) => {
    response.render("end-page.ejs", { ID: request.params.ID});
});

//Ongoing Call for a particular Call ID
app.get("/:ID", (request, response) => {
    response.render("call.ejs", { ID: request.params.ID });
});

/*

Establishing socket connection between server and client:

Whenever a new client connects to the server, it responds with the creation of a socket.
The socket assigned at connection is used for further communication between the server and the client.

Message received by socket: "join-call"
Action: The socket joins the client to the call identified by callID and informs the existing clients in the call about the new connection.

Message received by socket: "end"
Action: The socket informs the existing clients in the call that the user identified by userID has disconnected.

Once the client has joined the call:

Message received by socket: "new-message"
Action: The socket informs the existing clients in the call about the new message to be added.

Message received by socket: "disconnect"
Action: The socket informs the existing clients in the call that the user identified by userID has disconnected.

*/

io.on("connection", (socket) => {
    socket.on("join-call", (callID, userID) => {
        socket.join(callID);
        socket.broadcast.to(callID).emit("new-user-connected", userID);
        socket.on("new-message", (message) => {
            socket.broadcast.to(callID).emit("add-message", message);
        });
        socket.on("disconnect", () => {
            socket.broadcast.to(callID).emit("user-disconnected", userID);
        });
    });
    socket.on("end", (callID, userID) => {
        socket.broadcast.to(callID).emit("user-disconnected", userID);
    });
});

//The application can be accessed at "http://localhost:3030/"
server.listen(3030);
console.log("Running on Port 3030");