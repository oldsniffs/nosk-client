// Keeping websocket a const, in dom loaded

// Screens
// Login -> Welcome -> Game
// From game can swap between login screen
// From game can exit_world with char -> Welcome
var current_screen

var login_screen
var welcome_screen
var game_screen

// Always Top
var conn_status
var ingame_as

// Login
var login_button
var logout_button

// Welcome
var submit_character_button

// Game 
var location_title
var location_description
var items_present
var people_present
var command_input
var main_text

var characters = []
const ingame_character = {
    "name": "",
    "location": {
        "name": "",
        "default": "",
        "physical_description": "",
        "people": [],
        "items": [],
    }
}


function display_text(text_display, text) {
    // Slap a new <p> in the text_display div
    const t = document.createElement("p");
    t.appendChild(document.createTextNode(text))
    main_text.insertAdjacentElement("afterbegin", t);

    // Parse colors, links

    // Could remove content past a certain size to a buffer / storage zone
    // In other words limit the scrollable area but keep the excess handy
}

function listen_for_broadcasts(websocket) {
    console.log('now listening for broadcasts from server...')
    websocket.addEventListener("message", ({ data }) => {
        console.log(`recieving data ${data}`)
        const broadcast = JSON.parse(data);
        switch (broadcast.b_type) {    
            
            case "entrance_package":
                enter_world(broadcast)
                break

            case "location_status":
                update_location(broadcast)
                break
            
            case "charsheet":
                update_charsheet(broadcast)
                break

            // Character updates
                

            case "welcome":
                characters = broadcast.characters
                show_welcome_screen(websocket)
                break

            case "display_text_only": // Use as default?
                // Access display_text, call display_text on text attribute
                // JSON will likely be needed for colored, clickable text
                display_text(broadcast.text)
                break
        }
    });
}

// Transmissions are game related
function send_transmission(websocket, transmission) {
    websocket.send(json.stringify(transmission));
}

function show_game_screen(websocket) {
    switch_to_screen(game_screen)
}

// View the characters
// Send one to the server
// Load Game screen if server tells us we've entered world
//Should be renamed welcome, and show welcome screen should just do that
// welcome does logic
function show_welcome_screen(websocket) {
    // update display
    console.log("Welcoming")
    switch_to_screen(welcome_screen)

    const characters_div = document.querySelector('#characters')
    const character_selection = document.querySelector('#character_selection')
    submit_character_button.disabled = true;
    characters_div.innerHTML = ""
    character_selection.innerHTML = ""
    
    
    function submit_character(selected_character) {
        console.log(`submit character ${selected_character} for world entry`)
        websocket.send(selected_character);
    }
    
    function select_character(char_name) {
        submit_character_button.disabled = false;
        character_selection.innerHTML = char_name;
        submit_character_button.addEventListener("click", function() {
            submit_character(char_name)
        })
    }

    // repopulate characters div
    console.log(characters)
    characters.forEach(function(character) {
        // add a p to character list
        // char name clickable to send choice to server
        const c = document.createElement("p");
        c.appendChild(document.createTextNode(character));
        characters_div.insertAdjacentElement("beforeend", c);
        c.addEventListener("click", function() {
            select_character(c.innerHTML)
        });
    })
}

function display_location() {
    // show generic in italics, name more noticeable 
    // terrain indicated by...? color? image? small label? color + small side label?

    // Check if name is known
    location_title.innerHTML = `${ingame_character.location.name} ${ingame_character.location.name}`;
    console.log()
    physical_description.innerHTML = ingame_character.location.phys_dsc;
    items_present.innerHTML = ingame_character.location.items;
    people_present.innerHTML = ingame_character.location.people;
}

function enter_world(package) {
    ingame_character.name = package.charsheet.name
    ingame_character.location = package.charsheet.location
    
    show_game_screen()
    display_location()    
    // Display messages
    
    let messages = package.messages
    messages.forEach(function(message) {
        display_text(message)
    })    
    
}

function show_login_screen() {
    switch_to_screen(login_screen)    
}

function switch_to_screen(new_screen) {
    current_screen.hidden = true;
    new_screen.hidden = false;
    current_screen = new_screen;
}

function load_elements() {
    login_screen = document.querySelector("#login_screen")
    welcome_screen = document.querySelector("#welcome_screen")
    game_screen = document.querySelector("#game_screen")
    // Always Top
    conn_status = document.querySelector('#conn_status')
    ingame_as = document.querySelector('#ingame_as')

    // Login
    login_button = document.querySelector('#login_button')
    logout_button = document.querySelector('#logout_button')

    // Welcome
    submit_character_button = submit_character_button = document.querySelector('#submit_character_button')

    // Game 
    location_title = document.querySelector("#location_title")
    location_description = document.querySelector("#location_description")
    items_present = document.querySelector("#items_present")
    people_present = document.querySelector("#people_present")
    command_input = document.querySelector("#command_input")
    main_text = document.querySelector("#main_text")

    characters = []   
}

function getWebSocketServer() {
    var ws_server
    if (window.location.host == "https://oldsniffs.github.io/nosk-client/") {
        ws_server = "wss://nosk-online.herokuapp.com/";
    } else if (window.location.host == "localhost:8000") {
        ws_server = "ws://localhost:8001/";
    } else {
        throw new Error(`Unsupported host: ${window.location.host}`);
    }
    console.log(`Using Websocket Server: ${ws_server} for Host ${window.location.host}`)
    return ws_server
}

document.addEventListener('DOMContentLoaded', () => {
    // Get elements

    load_elements()
    
    welcome_screen.hidden = true;
    game_screen.hidden = true;
    current_screen = login_screen;

    login_button.disabled = false;
    logout_button.disabled = true;

    document.querySelector('#login_button').addEventListener("click", function() {
        connect()
    })

    function connect() {
        console.log('Opening connection to game server');
        // const websocket = new WebSocket('ws://localhost:8001');
        const websocket = new WebSocket(getWebSocketServer());
        // const websocket = new WebSocket('wss://nosk-online.herokuapp.com/');   

        // Connection opened
        websocket.addEventListener('open', function (event) {
            conn_status.innerHTML = "Connected"
            conn_status.style.color = 'green'
            
            let username = document.querySelector('#username').value;
            let password = document.querySelector('#password').value;
            console.log(`Login attempt with username: ${username} password: ${password}`);
            websocket.send(`${username} - ${password}`);

            login_button.disabled = true;
            logout_button.disabled = false

        });

        // Connection closed
        websocket.addEventListener('close', function (event) {
            conn_status.innerHTML = "Not Connected"
            conn_status.style.color = 'red'
            logout_button.disabled = true;
            login_button.disabled = false;
            switch_to_screen(login_screen)
        })

        listen_for_broadcasts(websocket)
        // Login tasks have been performed, control can be handed over to the broadcast listener

    };
    


    // Listen for messages
    // websocket.addEventListener('message')

})
