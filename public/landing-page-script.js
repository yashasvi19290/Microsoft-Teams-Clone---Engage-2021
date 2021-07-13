//To initiate a new call: Redirect to route path "/new"
function initiateNewCall(){
    window.location.href = "/new";
}

//To join an existing call: Get input callID and fetch response to route path "/join" with callID as a parameter
//Redirect to the path the server responds with
function joinExistingCall(){
    const callID = document.getElementById("callID").value;
    fetch("/join", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ID: callID
        })
    }).then(response => {
        response.redirected;
        window.location.href = response.url;
    });
}