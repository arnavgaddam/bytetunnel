import React, { useState, useEffect, useRef } from 'react';
import '../styles/tunnel.css';
import { useParams } from 'react-router-dom';

export default function Tunnel() {
    // Keep track of files and current client ID
    const [files, setFiles] = useState([]);
    const [clientId, setClientId] = useState(generateCode());

    // Declare Refs for WebRTC logic
    const host = useRef(false);
    const connection = useRef(null);
    const dataChannel = useRef(null);
    const websocket = useRef(new WebSocket("ws://localhost:8765"));

    const config = {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    };

    let { tunnelCode } = useParams();

    // Initialize WebSocket connection on component mount
    useEffect(() => {
        websocket.current.onopen = initSocket;
    }, []);

    // Triggers when new files are added
    useEffect(() => {
        // console.log(files);
    }, [files]);

    // Initializes websocket by registering with server
    function initSocket() {

        // Initialize message listener 
        websocket.current.onmessage = handleSignal;
        
        // Register with server: triggers rest of code flow once a response is received
        const register_request = JSON.stringify({
            type: "register",
            clientId: clientId,
            tunnelId: tunnelCode
        })
        
        // Send message to server
        websocket.current.send(register_request);
  }

    // Function to handle signaling server messages
    const handleSignal = (event) => {
        // Parse string coming in over socket as JSON object
        const data = JSON.parse(event.data);
        console.log(data);

        // Branch depending on type of message
        switch (data.type) {
            
            // Client successfully registered
            case "register_success":
                console.log("Registered successfully.");
                break;
            
            // Contains number of clients currently connected to server
            case "broadcast":
                // Update host role
                updateHost(data.count);
                console.log("Peers connected: ", data.count == 2);
                // Setup connection when peer joins tunnel
                if (data.count > 1) {
                    setupConnection();
                }
                break;

            // Received an offer from another client
            case "offer":
                handleOffer(data.offer, data.clientId);
                break;
            
            // Received an answer to offer from other client
            case "answer":
                handleAnswer(data.answer);
                break;
            
            // Received ice candidate from other client
            case "ice":
                receiveIceCandidate(data.candidate);
                break;

            default:
                break;
        }
    };

    // sends ice candidate to peer 
    function sendIceCandidate(event) {
        // console.log("New ice candidate found:", event.candidate);
        // Send this ice candidate over the signaling server to the other peer
        const ice_message = JSON.stringify({
            type: "ice",
            clientId: clientId,
            tunnelId: tunnelCode,
            candidate: event.candidate
        });
        websocket.current.send(ice_message);
        }

    // Function to update host based on number of connected clients
    function updateHost(clientCount) {
        if (clientCount == 1) {
            host.current = true;
        }
        console.log("Host:", host.current);
    }

    // Sets up connection after both peers are connected. 
    function setupConnection() {
        // Initialize webrtc connection
        connection.current = new RTCPeerConnection(config);
        // Define callback for when ice candidates are discovered and connection state changes
        connection.current.onconnectionstatechange = handleConnectionState;
        connection.current.onicecandidate = sendIceCandidate;
    
        // Depending on whether this peer is a host or not, create or receive a data channel
        if (host.current == true) {
            // setDataChannel(connection.current.createDataChannel("fileChannel"));
            dataChannel.current = connection.current.createDataChannel("fileChannel");
            initDataChannel();        
            makeOffer();
        }
        else {
            connection.current.ondatachannel = receiveDataChannel;
        }
    }

    // Makes an offer to peer
    async function makeOffer() {
        // Create offer object
        const offer_obj = await connection.current.createOffer();
        // Update local description
        connection.current.setLocalDescription(offer_obj);
        // Create and send offer message
        const offerMessage = JSON.stringify({
            type: "offer",
            clientId: clientId,
            tunnelID: tunnelCode,
            offer: offer_obj
        })
        websocket.current.send(offerMessage);
    }

    // handles incoming offer from signaling server
    async function handleOffer(offer, sender_id) {
        // Set remote description of connection
        await connection.current.setRemoteDescription(offer);
        // Create answer and set as local description
        const answer_obj = await connection.current.createAnswer();
        connection.current.setLocalDescription(answer_obj);
        // Create and send answer message to peer
        const answer_message = JSON.stringify({
            type: "answer",
            senderId: sender_id,
            clientId: clientId,
            tunnelID: tunnelCode,
            answer: answer_obj
        })
        websocket.current.send(answer_message);
    }

    // Callback function called when receiving ice candidates from peer over signaling server
    function receiveIceCandidate(ice_candidate) {
        // Add ice candidate to connection if not null
        if (ice_candidate == null) {
            return;
        }
        connection.current.addIceCandidate(ice_candidate);
    }

    // Handles incoming answer 
    async function handleAnswer(answer) {
        // Set remote description as answer
        await connection.current.setRemoteDescription(answer);
    }

    // Callback when connection state changes
    function handleConnectionState() {
        console.log("connection state:", connection.current.connectionState);
    }

    // Function called when data channel received
    function receiveDataChannel(event) {
        // Initialize data channel
        dataChannel.current = event.channel;
        initDataChannel();
    }

    // Initializes data channel with callbacks
    function initDataChannel() {
        // Bind callbacks for onopen and onmessage
        dataChannel.current.onopen = dataChannelOpen;
        dataChannel.current.onmessage = handleChannelMessage;
    }

    // Called when data channel opens
    function dataChannelOpen() {
        console.log("Data channel opened.");
        // Flush files
    }

    // Called when message received over data channel
    function handleChannelMessage(event) {
        console.log("Received message:", event.data);
        // if (typeof event.data === 'string') {
        //   // Contains metadata
        //   const message = JSON.parse(event.data);
        //   console.log("metadata received", message);
        //   if (message.type === 'file-metadata') {
        //     receivedMetadata = message;
        //     receivedBuffers = [];
        //     receivedSize = 0;
        //   } else if (message.type === 'file-complete') {
        //     saveFile(receivedBuffers, receivedMetadata);
        //     receivedMetadata = null;
        //     receivedBuffers = [];
        //     receivedSize = 0;
        //   }
        // } else {
        //   // Handle chunks of array buffers
      
        //   receivedBuffers.push(event.data);
        //   receivedSize += event.data.byteLength;
        //   if (receivedSize >= receivedMetadata.fileSize) {
        //     saveFile(receivedBuffers, receivedMetadata);
        //     receivedMetadata = null;
        //     receivedBuffers = [];
        //     receivedSize = 0;
        //   }
        // }
      }
    


    // Function to generate a 6-character pronounceabletunnelCode 
    function generateCode() {
        const consonants = 'bcdfghjklmnpqrstvwxyz';
        const vowels = 'aeiou';
        let tunnelCode = '';
        for (let i = 0; i < 3; i++) {
        tunnelCode += consonants.charAt(Math.floor(Math.random() * consonants.length));
        tunnelCode += vowels.charAt(Math.floor(Math.random() * vowels.length));
        }
        return tunnelCode;
    }

    // Handle file input change event
    const handleFileInputChange = (event) => {
        console.log("Uploaded file:", event.target.files[0]);
        const newFiles = Array.from(event.target.files);
        setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    };



    return (
        <div className="container">
        <div className="upload-box">
            <h1>Upload Files</h1>
            <div className="tunnelCode-display">{tunnelCode}</div>
            <div className="file-input-container">
            <label htmlFor="fileInput" className="file-input-label">Choose Files</label>
            <input type="file" id="fileInput" multiple onChange={handleFileInputChange} />
            </div>
        </div>
        <div className="file-list-box">
            <h1>Files</h1>
            <ul id="fileList">
            {files.map((file, index) => (
                <li key={index}>
                {file.name}
                {/* <img src="download-icon.svg" alt="Download" className="download-icon" /> */}
                </li>
            ))}
            </ul>
        </div>
        </div>
    );
}
