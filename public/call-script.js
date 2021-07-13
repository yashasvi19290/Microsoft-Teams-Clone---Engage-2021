//Displaying Call ID in the title space for information of the participants
const titleSpan = document.createElement("span");
titleSpan.innerText = ("Meeting ID: " + ID);
document.getElementById("title").appendChild(titleSpan);

//Initializing connection variables
var socket = io();
var peer = new Peer();

//Declaring user identification variables
let userStream;
let self;
let userName;
const attendees = document.getElementById("attendees");
const otherUsers = {};

//Setting up the chat window
const chatPane = document.getElementById("chat-pane");
let chatMain = document.createElement("div");
chatMain.setAttribute("class", "chat-main");
let chatInput = document.createElement("input");
chatInput.setAttribute("class", "chat-input");
chatInput.placeholder = "Press Enter to send...";
chatPane.appendChild(chatMain);
chatPane.appendChild(chatInput);

/*

To establish connection among participants:

When connection to the Peer Server is established, we first obtain the user stream and add it to the page.
The user can then set up his stream, following which he is required to click the 'Enter' button to join the call.
The option to edit username is disabled and the 'join-call' message is emitted by the socket to the server.

*/

peer.on("open", (userID) => {
    getUserStream();
    const enter = document.getElementById("enter-button");
    enter.addEventListener("click", () => {
        self = userID;
        const name = document.getElementById("name");
        if(name.value.length > 0)
            userName = name.value;
        else
            userName = "Anonymous";
        name.value = userName;
        name.setAttribute("disabled", true);
        socket.emit("join-call", ID, userID);
        enter.remove();
    });
});

//To obtain the user stream
function getUserStream(){
    const user = document.createElement("video");
    user.muted = true;
    navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
    }).then((stream) => {
        userStream = stream;
        addUserStream(user, userStream);
    });
}

/*

To connect a new user to the current user:

The current user makes a call to the new user with his stream. 
When the call is answered with the new user's stream, the stream is added to the page.
The new user is added to the list of other users.
When a particular call is closed, the corresponding user's stream is removed from the page.

*/

socket.on("new-user-connected", (userID) => {
    const call = peer.call(userID, userStream);
    const newUser = document.createElement("video");
    newUser.muted = true;
    call.on("stream", (newUserStream) => {
        addUserStream(newUser, newUserStream);
    });
    call.on("error", (error) => {
        alert(error);
    });
    call.on("close", () => {
        newUser.remove();
    })
    otherUsers[userID] = call;
});

//To disconnect a user from the call: The corresponding call is closed
socket.on("user-disconnected", (userID) => {
    if(otherUsers[userID]){
        otherUsers[userID].close();
    }
});

/*

To join other participants in the call:

The incoming call is answered with the user's own stream.
The incoming stream is added to the page and the corresponding user is added to the list of other users.
When the call is closed, the corresponding user's stream is removed from the page.

*/

peer.on("call", (call) => {
    call.answer(userStream);
    const newUser = document.createElement("video");
    newUser.muted = true;
    call.on("stream" , (newUserStream) => {
        addUserStream(newUser, newUserStream);
    });
    call.on("error", (error) => {
        alert(error);
    });
    call.on("close", () => {
        newUser.remove();
    })
    otherUsers[call.peer] = call;
});

//To add a stream to the page
function addUserStream(user, stream){
    user.srcObject = stream;
    user.addEventListener("loadedmetadata", () => {
        var promise = user.play();
        if(promise){
            promise.catch(error => {
                console.error(error);
            });
        }
        attendees.appendChild(user);
        user.muted = false;
    });
}

//To pause or play video
function toggleVideo(){
    if(userStream.getVideoTracks()[0].enabled){
        userStream.getVideoTracks()[0].enabled = false;
        document.getElementById("video").innerHTML = `<i class="bx bxs-video-off bx-md bx-border-circle"></i>`;
    }
    else{
        userStream.getVideoTracks()[0].enabled = true;
        document.getElementById("video").innerHTML = `<i class="bx bxs-video bx-md bx-border-circle"></i>`;
    }
}

//To mute or unmute audio
function toggleAudio(){
    if(userStream.getAudioTracks()[0].enabled){
        userStream.getAudioTracks()[0].enabled = false;
        document.getElementById("audio").innerHTML = `<i class="bx bxs-microphone-off bx-md bx-border-circle"></i>`;
    }
    else{
        userStream.getAudioTracks()[0].enabled = true;
        document.getElementById("audio").innerHTML = `<i class="bx bxs-microphone bx-md bx-border-circle"></i>`;
    }
}

//To end the call: Fetch response to route path "/end" with ID as a parameter
//Redirect to the path the server responds with
function hangUp(){
    socket.emit("end", ID, self);
    fetch("/end", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ID: ID
        })
    }).then(response => {
        response.redirected;
        window.location.href = response.url;
    });
}

//To display or hide the chat window
function toggleChat(){
    if(chatPane.classList.contains("open")){
        document.getElementById("chat").innerHTML = `<i class="bx bxs-chat bx-md bx-border-circle"></i>`;
        chatPane.classList.remove("open");
        chatPane.style.visibility = "hidden";
        attendees.style.width = "100%";
    }
    else{
        document.getElementById("chat").innerHTML = `<i class="bx bxs-chevrons-right bx-md bx-border-circle"></i>`;
        chatPane.classList.add("open");
        chatPane.style.visibility = "visible";
        attendees.style.width = "75%";
    }
}

/*

To send messages on the chat:

When the 'Enter' key is pressed, the program checks for the validity of the input.
In case of a valid input, the message is added to the user's chat window.
The socket emits 'new-message' to the server with the username and message as parameters.

*/

chatInput.addEventListener("keypress", (event) => {
    if(event.key == "Enter"){
        if(chatInput.value.length > 0){
            addMessageToChat(`${userName}: \n${chatInput.value}`);
            socket.emit("new-message", `${userName}: \n${chatInput.value}`);
            chatInput.value = "";
        }
    }
});

//To add message sent by the server to the chat window
socket.on("add-message", (message) => {
    addMessageToChat(message);
});

//To add message to chat window
function addMessageToChat(message){
    let newMessage = document.createElement("div");
    newMessage.setAttribute("class", "chat-message");
    let messageSpan = document.createElement("span");
    messageSpan.innerText = message;
    newMessage.appendChild(messageSpan);
    chatMain.appendChild(newMessage); 
}