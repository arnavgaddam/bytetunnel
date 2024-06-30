// src/tunnel.js

// Function to generate a random client ID
function generateRandomCode(length) {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  return result;
}

// Get the generated code from the URL parameters
const urlParams = new URLSearchParams(window.location.search);
const tunnel_code = urlParams.get('code');
const client_id = generateRandomCode(5);

const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const placeholder = document.getElementById('placeholder');

const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

// WebRTC setup
let connection;
let dataChannel;
let host = false;
const signalingServer = "ws://localhost:8765";
const websocket = new WebSocket(signalingServer);
let CHUNK_SIZE = 16000;


// Initialize the WebRTC connection
if (tunnel_code) {
  document.getElementById('code').textContent = `Your tunnel code: ${tunnel_code}`;
}

// window.onload = setupConnection;
websocket.onopen = initSocket;



// Sets up connection after both peers are connected. 
function setupConnection() {
  console.log("initializing webrtc connection");
  connection = new RTCPeerConnection(config);

  // Define callback for when ice candidates are discovered
  connection.onconnectionstatechange = handleConnectionState;
  connection.onicecandidate = sendIceCandidate;

  // Depending on whether this peer is a host or not, create or receive a data channel
  if (host == true) {
    dataChannel = connection.createDataChannel("fileChannel");
    initDataChannel();

    makeOffer();
  }
  else {
    connection.ondatachannel = receiveDataChannel;
  }



}

let receivedBuffers = [];
let receivedMetadata = null;
let receivedSize = 0;

function handleChannelMessage(event) {
  console.log("Received message:", event.data);
  if (typeof event.data === 'string') {
    // Contains metadata
    const message = JSON.parse(event.data);
    console.log("metadata received", message);
    if (message.type === 'file-metadata') {
      receivedMetadata = message;
      receivedBuffers = [];
      receivedSize = 0;
    } else if (message.type === 'file-complete') {
      saveFile(receivedBuffers, receivedMetadata);
      receivedMetadata = null;
      receivedBuffers = [];
      receivedSize = 0;
    }
  } else {
    // Handle chunks of array buffers

    receivedBuffers.push(event.data);
    receivedSize += event.data.byteLength;
    if (receivedSize >= receivedMetadata.fileSize) {
      saveFile(receivedBuffers, receivedMetadata);
      receivedMetadata = null;
      receivedBuffers = [];
      receivedSize = 0;
    }
  }
}

// Saves file from buffers
function saveFile(buffers, metadata) {
  if (metadata == null) {
    return;
  }

  const blob = new Blob(buffers, { type: metadata.fileType });
  const url = URL.createObjectURL(blob);

  // Create a list item to display the file in the file list
  const li = document.createElement('li');

  const fileNameSpan = document.createElement('span');
  fileNameSpan.textContent = metadata.fileName;

  // const downloadIcon = document.createElement('span');
  // downloadIcon.classList.add('download-icon');
  // downloadIcon.innerHTML = '&#x1F4BE;'; // Download icon

  const downloadIcon = document.createElement('img');
  downloadIcon.classList.add('download-icon');
  downloadIcon.src = "public/download_icon.svg";
  downloadIcon.alt = 'Download';

  li.appendChild(fileNameSpan);
  li.appendChild(downloadIcon);
  li.style.cursor = "pointer";

  // Add click event to the list item to download the file
  li.addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = metadata.fileName;
    a.click();
  });

  // Append the list item to the file list
  const fileList = document.getElementById('fileList');
  fileList.appendChild(li);
}


function initDataChannel() {
  dataChannel.onopen = dataChannelOpen;
  dataChannel.onmessage = handleChannelMessage;
}


function dataChannelOpen() {
  // dataChannel.send("Hello");
  flushFiles();
}

function receiveDataChannel(event) {
  dataChannel = event.channel;
  initDataChannel();
}

function handleConnectionState() {
  console.log("Connection state:", connection.connectionState);
}

function sendIceCandidate(event) {
  // console.log("New ice candidate found:", event.candidate);
  // Send this ice candidate over the signaling server to the other peer
  const ice_message = JSON.stringify({
    type: "ice",
    clientId: client_id,
    tunnelId: tunnel_code,
    candidate: event.candidate
  });
  websocket.send(ice_message);
}

function closeConnection() {
  if (connection) {
    console.log("closing connection");
    connection.close();
  }
}

// Initializes websocket by registering with server
function initSocket() {
  // Initialize message listener 
  websocket.onmessage = handleSignal;
  
  // Register with server
  const register_request = JSON.stringify({
    type: "register",
    clientId: client_id,
    tunnelId: tunnel_code
  })

  websocket.send(register_request);
}

// Handles signaling server messages
function handleSignal(message) {
  data = JSON.parse(message.data)
  console.log(data);

  switch (data.type) {

    case "register_success":
      break;
    
    case "broadcast":
      // Update current host when count of connected clients changes
      updateHost(data.count);
      if (data.count > 1) {
        setupConnection();
      }
      console.log("Peers connected: ", data.count == 2);
      break;

    case "offer":
      handleOffer(data.offer, data.clientId);
      break;

    case "answer":
      handleAnswer(data.answer);
      break;
    
    case "ice":
      const ice_candidate = data.candidate;
      receiveIceCandidate(ice_candidate); 
  }
}

// Callback function called when receiving ice candidates from peer over signaling server
function receiveIceCandidate(ice_candidate) {
  // console.log("Adding external ice candidate:", ice_candidate);
  if (ice_candidate == null) {
    return;
  }
  connection.addIceCandidate(ice_candidate);
}

// Makes an offer to peer
async function makeOffer() {
  offer_obj = await connection.createOffer();
  connection.setLocalDescription(offer_obj);
  const offerMessage = JSON.stringify({
    type: "offer",
    clientId: client_id,
    tunnelID: tunnel_code,
    offer: offer_obj
  })
  websocket.send(offerMessage);
}

// handles incoming offer from signaling server
async function handleOffer(offer, sender_id) {
  await connection.setRemoteDescription(offer);
  answer_obj = await connection.createAnswer();
  connection.setLocalDescription(answer_obj);
  const answer_message = JSON.stringify({
    type: "answer",
    senderId: sender_id,
    clientId: client_id,
    tunnelID: tunnel_code,
    answer: answer_obj
  })
  websocket.send(answer_message);
}

// Handles incoming answer 
async function handleAnswer(answer) {
  await connection.setRemoteDescription(answer);
}


function updateHost(count) {
  if (count == 1) {
    closeConnection();
    host = true;
  }
  console.log("Host:", host, "ID:", client_id);
}

// File uploading logic 


// Flushes files from filelist to peer
function flushFiles() {
  const files = fileInput.files;

  if (files.length > 0) {
    for (const file of files) {
      console.log("sending file to peer:", file);
      sendFile(file);
    }
  } else {
    console.log("No files uploaded.");
  }
}

// Sends a file in chunks, along with its metadata
function sendFile(file) {
  const fileMetadata = {
    type: "file-metadata",
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size
  };
  dataChannel.send(JSON.stringify(fileMetadata));
  sendFileChunks(file);
}

// Sends file in chunks over data channel
function sendFileChunks(file) {
  let offset = 0;

  const reader = new FileReader();
  reader.onload = () => {
    const chunk = reader.result;
    dataChannel.send(chunk);

    offset += CHUNK_SIZE;
    if (offset < file.size) {
      readSlice(offset);
    } else {
      dataChannel.send(JSON.stringify({ type: "file-complete" }));
    }
  };

  const readSlice = (o) => {
    const slice = file.slice(offset, o + CHUNK_SIZE);
    reader.readAsArrayBuffer(slice);
  };

  readSlice(0);
}

fileInput.addEventListener('change', () => {
  const files = fileInput.files;
  if (files.length > 0) {
    // fileList.innerHTML = ''; // Clear the list
    for (const file of files) {
      displayFile(file.name);
      // If channel is open, send the file
      if (dataChannel != null) {
        if (dataChannel.readyState == "open"){
          console.log("Sending file:", file);
          sendFile(file);
        }
      }

    }
  } else {
    placeholder.style.display = 'block';
  }
});

function displayFile(fileName) {
  const li = document.createElement('li');
  li.textContent = fileName;
  fileList.appendChild(li);
}