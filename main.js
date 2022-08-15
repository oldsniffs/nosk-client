// These relate to Server App's verbs.py
const PLAYER_VERBS = [
    'eat',
    'drink',
    'i', 'inventory', 'inv',
    'friends',
    'drop' // inventory -> environment
]

const WORLD_VERBS = [
    '"', "'", "!", "?",
    'go', 'n','north','northeast','ne','northwest','nw','s','south','southeast','se','southweat','sw','e','east','w','west',
    'speak', 'yell',
    'look',
    'survey',
    'pickup', // environment - > inventory
]

const DENIZEN_INTERACTION_VERBS = [
    'slap',
    'talk',
    'shop',
    'give',
    'aim',
    'shoot',
    'strike',
]


const multverbs = {
    "north": ['n','north'],
    "east": ['e','east'],
    "south": ['s','south'],
    "west": ['w','west'],
    "inventory": ['i', 'inv', 'inventory']
}

const ALL_VERBS = PLAYER_VERBS + WORLD_VERBS + DENIZEN_INTERACTION_VERBS

var websocket


// Screens
// Login -> Welcome -> Game
// From game can swap between login screen
// From game can exit_world with char -> Welcome
var current_screen

var login_screen
var welcome_screen
var game_screen

// Always Top
var conn_status_display
var ingame_as

// Login
var login_button
var logout_button
var username_input
var password_input

// Welcome
var submit_character_button

// Game 
var loc_title
var loc_phys_dsc
var loc_items
var loc_people
var command_input
var main_text

var characters = []
var ingame_character = {}
var selected_character


function display_main_text(messages) {
    messages.forEach( function(message) {

        // Slap a new <p> in the text_display div
        const t = document.createElement("p");
        t.appendChild(document.createTextNode(message))
        main_text.insertAdjacentElement("afterbegin", t);        
        // Parse colors, clickable links

    })

    // Could remove content past a certain size to a buffer / storage zone
    // In other words limit the scrollable area but keep the excess handy

    // Should interpret 
    // Ex 
    // You start walking north >
    // [result]
}


// Could switch to a different listener once in game to narrow switches
function listen_for_broadcasts(websocket) {
    console.log('now listening for broadcasts from server...')
    websocket.addEventListener("message", ({ data }) => {
        console.log(`recieving data ${data}`)
        const broadcast = JSON.parse(data);
        broadcast.contents.forEach(function(broadcast_content) {
            console.log(`case for ${broadcast_content}`)
            switch (broadcast_content) {    
                
                case "welcome":
                    characters = broadcast.characters
                    show_welcome_screen(websocket)
                    break
            
                case "entrance_package":
                    enter_world(websocket, broadcast)
                    break

                case "location_update":
                    ingame_character.location = broadcast.location_data
                    location_update(broadcast)
                    break
                
                case "charsheet":
                    update_charsheet(broadcast)
                    break

                case "main_text_messages":
                    display_main_text(broadcast.messages)
                    break

                case "action_response":
                    display_main_text(broadcast.messages)
                    break
            }
        });
    });
}

// Transmissions are game related
function send_transmission(websocket, transmission) {
    websocket.send(JSON.stringify(transmission));
}



function show_game_screen(websocket) {
    // Setup
    switch_to_screen(game_screen)
    command_input.focus()
}

function parse_command(input) {
    console.log(`parse input ${input}`)
    const words = input.toLowerCase().split(' ');
    console.log(`words ${words}`)
    let command = {
        verb: "",
        target: "",
        direct_object: "",
        quantity: 0,
    }

    if (ALL_VERBS.includes(words[0])) {
        command.verb = words[0]
    }
    else {
        console.log(`Unknown Verb ${command.verb}`)
        command.verb = "Unknown Verb"
        return false
    }

    if (words.length === 2) {
        command.target = words[1]
    }

    else if (words.length > 2) {
        // tell user bad input
        console.log("we don't accept more than 2 words yet")
        return false
    }
    
    
    if (['go', 'n','north','northeast','ne','northwest','nw','s','south','southeast','se','southweat','sw','e','east','w','west',].includes(command.verb)) {
        command = clean_go(command)
    }    
    
    console.log(`created this command ${command.verb} ${command.target}`)
    return command      
}

function clean_go(command) {
    
    if (command.verb=='n' || command.verb=='north') {        
        command.target='north'
    }     
    else if (command.verb=='ne' || command.verb=='northeast') {
        command.target='northeast'
    }    
    else if (command.verb=='nw' || command.verb=='northwest') {
        command.target='northwest'
    }    
    else if (command.verb=='s' || command.verb=='south') {
        command.target='south'
    }    
    else if (command.verb=='se' || command.verb=='southeast') {
        command.target='southeast'
    }    
    else if (command.verb=='sw' || command.verb=='southwest') {
        command.target='southwest'
    }    
    else if (command.verb=='e' || command.verb=='east') {
        command.target='east'
    }    
    else if (command.verb=='w' || command.verb=='west') {
        command.target='west'
    }    
    // Special Exits?
    
    // No target
    else {
        if (command.target=='') {
            command.target='no travel destination'
        }
    }
    
    command.verb="travel"
    return command
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
    characters_div.innerHTML = ""
    character_selection.innerHTML = ""    
    selected_character = ""
    submit_character_button.disabled = true;

    function submit_character(handler) {
        console.log(`submit character ${selected_character} for world entry`)
        websocket.send(selected_character);
        submit_character_button.removeEventListener('click', handler);
    }

    function select_character(char_name) {
        submit_character_button.disabled = false;
        character_selection.innerHTML = char_name;
        selected_character = char_name;
        // This is wrong. Can add this listener earlier
        submit_character_button.addEventListener("click", function submit_handler() {
            submit_character(submit_handler);
        });


    }

    // repopulate characters div
    console.log(characters)
    characters.forEach(function(character) {
        const c = document.createElement("p");
        c.appendChild(document.createTextNode(character));
        c.style.color = 'teal';
        characters_div.insertAdjacentElement("beforeend", c);
        
        // Make name clickable to select choice
        c.addEventListener("click", function() {
            console.log('click')
            select_character(c.innerHTML)            
        });
        console.log(`added ${character} to characters div`);
    })
}


function location_update() {
    // show generic in italics, name more noticeable 
    // terrain indicated by...? color? image? small label? color + small side label?

    loc = ingame_character.location
    loc_title.innerHTML = `${loc.name} ${loc.generic}, Region of ${loc.region}`;
    loc_phys_dsc.innerHTML = loc.phys_dsc;
    // loc_items.innerHTML = loc.items;
    // loc_people.innerHTML = loc.people;
    
    // debugging
    console.log(`current location xy: ${loc.x}, ${loc.y}`)

    // populate exits div

    // Roads first in blue
    // make detail expand function so it can be toggled always on
    // road East (safe) <mouse expand> -> gentle climb toward rough hills

    console.log(loc.exits)
    loc_exits.innerHTML = ""
    isFirst = true;
    loc.exits.forEach( function(exit) {
        const direction = document.createElement("span");
        if (isFirst == true) {
            direction.innerHTML = exit.direction;
            isFirst = false;
        } else {
            direction.innerHTML = ", ".concat(exit.direction);
        }
        
        // direction.innerHTML = exit.direction;
        loc_exits.insertAdjacentElement("beforeend", direction);
    });
            
}

function submit_command(e) {
    if (e.code === "Enter") {
        command = parse_command(command_input.value)
        // if command valid
        command_input.value = ""
        
        if (command != false) {
            transmission = {
                "type": "action_command",
                "command": command,
            }
            send_transmission(websocket, transmission)
        }
    }
}

function enter_world(websocket, package) {    
    submit_character_button.disabled = true
    ingame_character = package.charsheet
    command_input.addEventListener('keyup', submit_command)
    
    show_game_screen();
    location_update();
    
    // Activate command input
    
    // Display messages
    let messages = package.messages
    messages.forEach(function(message) {
        display_main_text(message);
    });
    
}

function exit_world() {
    // Deactive command input
    console.log('exiting world')
    command_input.removeEventListener('keyup', submit_command)
}

function show_login_screen() {
    switch_to_screen(login_screen)   ; 
}

function switch_to_screen(new_screen) {
    document.activeElement.blur();
    current_screen.hidden = true;
    new_screen.hidden = false;
    current_screen = new_screen;
}

function init_elements() {
    login_screen = document.querySelector("#login-screen");
    welcome_screen = document.querySelector("#welcome-screen");
    game_screen = document.querySelector("#game-screen");
    // Always Top
    conn_status_display = document.querySelector('#conn_status_display');
    ingame_as_display = document.querySelector('#ingame_as_display');
    conn_status_display.innerHTML = "Not Connected";
    conn_status_display.style.color = "rgb(255, 122, 135)"


    // Login
    login_button = document.querySelector('#login-button');
    logout_button = document.querySelector('#logout-button');
    username_input = document.querySelector('#username')
    password_input = document.querySelector('#password')

    login_button.addEventListener('keyup', function(event) {
        connect(event);
    })

    // Welcome
    submit_character_button = document.querySelector('#submit_character_button');

    // Game 
    loc_title = document.querySelector("#loc-title");
    loc_phys_dsc = document.querySelector("#loc-phys_dsc");
    loc_exits = document.querySelector("#loc-exits")
    loc_items = document.querySelector("#loc-items");
    loc_people = document.querySelector("#loc-people")
    command_input = document.querySelector("#command-input");
    main_text = document.querySelector("#main-text");
    

    characters = [];
}

function getWebSocketServer() {
    var ws_server
    // if (window.location.host == "oldsniffs.github.io") {
    //     ws_server = "wss://nosk-online.herokuapp.com/";
    // } else 
    if (window.location.host == "localhost:8000") {
        ws_server = "ws://localhost:8001/";
    } else {
        ws_server = "wss://nosk-online.herokuapp.com/";
    }


    //     throw new Error(`Unsupported host: ${window.location.host}`);
    // }
    console.log(`Using Websocket Server: ${ws_server} for Host ${window.location.host}`)
    return ws_server
}



document.addEventListener('DOMContentLoaded', () => {
    // Get elements

    init_elements()
    
    welcome_screen.hidden = true;
    game_screen.hidden = true;
    current_screen = login_screen;

    login_button.disabled = false;
    logout_button.disabled = true;


    document.querySelector('#login-button').addEventListener("click", function() {
        connect()
    })
    username_input.addEventListener("keyup", function(event) {
        console.log(`keyup ${event.code} on username`)
        if (event.code === 'Enter') {
            connect()
        }
    });
    password_input.addEventListener("keyup", function(event) {
        console.log(`keyup ${event.code} on password`)
        if (event.code === 'Enter') {
            connect()
        }
    });


    function connect() {
        console.log('Opening connection to game server');
        websocket = new WebSocket(getWebSocketServer());  
    
        // Connection opened
        websocket.addEventListener('open', function (event) {
            conn_status_display.innerHTML = "Connected";
            conn_status_display.style.color = 'rgb(133,255,122)';
            
            let username = document.querySelector('#username').value;
            let password = document.querySelector('#password').value;
            console.log(`Login attempt with username: ${username} password: ${password}`);
            websocket.send(`${username} - ${password}`);
            
            login_button.disabled = true;
            logout_button.disabled = false;
    
        });
    
        // Connection closed
        websocket.addEventListener('close', function (event) {
            conn_status_display.innerHTML = "Not Connected"
            conn_status_display.style.color = 'rgb(255, 122, 135)'
            logout_button.disabled = true;
            login_button.disabled = false;
            switch_to_screen(login_screen)
            exit_world()
        })
    
        listen_for_broadcasts(websocket)
        // Login tasks have been performed, control can be handed over to the broadcast listener
    
    };

})
