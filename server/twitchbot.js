const tmi = require('tmi.js')
const Fuse = require('fuse.js')
const axios = require('axios')
const pclist = require('./rsLists/pclist.json')
require('dotenv').config()

const url = 'http://localhost:5000/api/posts/'

// Define config options for tmi.js
const tmiOptions = {
  options: {
    debug: true
  },
  connections: {
    secure: true,
    cluster: 'aws',
    reconnect: true
  },
  identity: {
    username: process.env.TWITCH_USERNAME,
    password: process.env.TWITCH_OAUTH
  },
  channels: [
    process.env.TWITCH_CHANNEL
  ]
}

// Define config options for fuse artist search
const fuseOptions = {
  shouldSort: true,
  threshold: 0.1,
  location: 0,
  distance: 100,
  maxPatternLength: 32,
  minMatchCharLength: 1,
  keys: [{
    name: 'colArtist',
    weight: 0.3
  }]
}

// Define config options for fuse title search
const fuseOptions2 = {
  shouldSort: true,
  threshold: 0.1,
  location: 0,
  distance: 100,
  maxPatternLength: 32,
  minMatchCharLength: 1,
  keys: [{
    name: 'colTitle',
    weight: 0.6
  }]
}

// Create a tmi client with our options
const client = new tmi.client(tmiOptions)

// Register our event handlers
client.on('message', onMessageHandler)
client.on('connected', onConnectedHandler)

// Connect to twitch
client.connect()

// Called whenever a message comes in
function onMessageHandler(target, context, msg, self) {
  
  // Ignore messages from the bot
  if (self) { return }

  // Remove whitespace from chat message
  const commandName = msg.trim()

  // Ignore all text except for commands that start with !
  if(commandName.startsWith('!')) {
    
    // Implement commands
    if(commandName.startsWith('!sr')) {
      
      // Strip the "!sr" from the query 
      let strippedSR = stripSR(msg)
      console.log(strippedSR);
      
      // Separate the remaining (!sr-less) query into an array with artist and title
      let separatedResults = separateResults(strippedSR)
      console.log(separatedResults) // Dev only
      
      // Create a fuse instance with our options for the first (artist) search
      let fuse = new Fuse(pclist, fuseOptions)

      // Perform the artist search
      const initialResults = fuse.search(separatedResults[0])

      // Create a fuse instance with our options for the second (title) search
      let fuse2 = new Fuse(initialResults, fuseOptions2)

      // Perform the title search on the initial results
      const results = fuse2.search(separatedResults[1])
      console.log(results); // Dev only

      // If nothing was detected
      if (results.length === 0) {
        client.action(process.env.TWITCH_CHANNEL, `${strippedSR} was not detected on playlist, please try another query`)
      // If more than one song was detected
      } if (results.length > 1){
        client.action(process.env.TWITCH_CHANNEL, `More than 1 song was detected for the query "${strippedSR}", try to narrow your search`)
      //One song was detected, add it to the database
      } if (results.length === 1) {
        axios.post(url, {
          text: strippedSR
        })
        .then(function (response) {
          console.log(response);
        })
        .catch(function (error) {
          console.log(error);
        })
      }
    } else {
      // Command is unknown
      client.say(target, `Unknown command "${commandName}"`)
    }
  }
}

// Called every time the bot connects to twitch chat
function onConnectedHandler(addr, port) {
  console.log(`* Connected to ${addr} on port ${port}`);
  
}

// Used to strip the "!sr" from the query to leave only "author - song"
function stripSR(message) {
  return message.split('!sr ').slice(1).join(' ')
}

// Used to separate the stripped query into an array with artist and title
function separateResults(strippedSR) {
  return strippedSR.split(' - ')
}