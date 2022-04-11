// Agonizing Questions:
// Should display update functions go inside the dom listener to avoid needing to pass references?

// Hide Login

// Show Login

// Are show hide logins needeD?

// Show characters
// each char in a li
// click event listener for li to send that char choice to server

// gets character_selection div on the DOM and broadcasted list of character names
// Creates colored character names user can click on to send that choice to the server
function show_characters(character_selection, characters) {

}

// Create game page


function display_text(text_display, text) {
    // Slap a new <p> in the text_display div
    const t = document.createElement("p");
    t.appendChild(document.createTextNode(text))
    text_display.insertAdjacentElement("afterbegin", t);

    // Parse colors, links

    // Could remove content past a certain size to a buffer / storage zone
    // In other words limit the scrollable area but keep the excess handy
}

function listen_for_broadcasts(websocket) {
    console.log('now listening for broadcasts from server...')
    websocket.addEventListener("message", ({ data }) => {
        const broadcast = JSON.parse(data);
        switch (broadcast.type) {

            
            case "charsheet":
                break

            case "welcome":
                welcome(websocket, broadcast.characters)
                break

            case "display_text_only": // Use as default?
                // Access display_text, call display_text on text attribute
                // JSON will likely be needed for colored, clickable text
                display_text(broadcast.text)
                break
        }
    });
}

function send_transmission(websocket, transmission) {
    websocket.send(json.stringify(transmission));
}

function submit_character(websocket, name) {
    console.log(`submitt character ${name}`)
    websocket.send(name);
    listen_for_broadcasts(websocket);
}

function welcome(websocket, characters) {
    // update display

    // (Hopefully) Clear unneeded divs
    document.querySelector('#credentials').hidden = true
    document.querySelector('#game_div').hidden = true
    document.querySelector('#characters').innerHTML = ""
    
    const characters_div = document.querySelector('#characters')
    // repopulate characters div
    console.log(characters)
    characters.forEach(function(character) {
        // add a p to character list
        // char name clickable to send choice to server
        const c = document.createElement("p");
        c.appendChild(document.createTextNode(character.name))
        characters_div.insertAdjacentElement("beforeend", c);
        c.addEventListener("click", function () {
            submit_character(websocket, c.innerHTML)
        });
    });
}


document.addEventListener('DOMContentLoaded', () => {
    const conn_status = document.querySelector('#conn_status')
    conn_status.style.color = 'red'
    const location_name = document.querySelector('#location_name')
    const location_description = document.querySelector('#location_description')
    const items_present = document.querySelector('#items_present')
    const others_present = document.querySelector('#others_present')
    const text_display = document.querySelector('#text_display')

    let counter = 1
    // dev test
    document.querySelector('#more_text').addEventListener("click", () => {
        display_text(text_display, `And I sure do hope you can read this too!!! ${counter}`)
        counter += 1;
    });
    display_text(text_display, 'I sure hope you can read this!')


    function connect() {
        console.log('Opening connection to game server');
        const websocket = new WebSocket('wss://websockets-tutorial.herokuapp.com/');   

        // Connection opened
        websocket.addEventListener('open', function (event) {
            conn_status.innerHTML = "Connected"
            conn_status.style.color = 'green'
            
            let username = document.querySelector('#username').value;
            let password = document.querySelector('#password').value;
            console.log(`Login attempt with username: ${username} password: ${password}`);
            websocket.send(`${username} - ${password}`);
        });

        // Connection closed
        websocket.addEventListener('close', function (event) {
            conn_status.innerHTML = "Not Connected"
            conn_status.style.color = 'red'
        })

        listen_for_broadcasts(websocket)
        // Login tasks have been performed, control can be handed over to the broadcast listener

    };
    
    document.querySelector('#login_button').addEventListener("click", connect);



    // Listen for messages
    // websocket.addEventListener('message')

})
