import React, { useState, useEffect } from 'react';
import '../styles/tunnel.css';
import { useParams } from 'react-router-dom';

export default function Tunnel() {
    const [files, setFiles] = useState([]);
    const [clientId, setClientId] = useState(generateCode());
    const [dataChannel, setDataChannel] = useState(null);
    const [connection, setConnection] = useState(null);
    const [websocket, setWebsocket] = useState(new WebSocket("ws://localhost:8765"));

    const config = {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    };

    let { tunnelCode } = useParams();
    const host = false;

    // Initialize WebSocket connection on component mount
    useEffect(() => {
        websocket.onopen = initSocket;
    }, []);

    // Initializes websocket by registering with server
    function initSocket() {
        // Initialize message listener 
        websocket.onmessage = handleSignal;
        
        // Register with server
        const register_request = JSON.stringify({
            type: "register",
            clientId: clientId,
            tunnelId: tunnelCode
        })
        
        websocket.send(register_request);
  }

    // Function to handle signaling server messages
    const handleSignal = (event) => {
        const data = JSON.parse(event.data);
        console.log(data);
        switch (data.type) {
            case "register_success":
                console.log("Registered successfully.");
                break;
            case "broadcast":
                updateHost(data.count);
                if (data.count > 1) {
                    setupConnection();
                }
                console.log("Peers connected: ", data.count == 2);
                break;
            case "offer":
                // handleOffer(data.offer, data.clientId);
                break;
            case "answer":
                // handleAnswer(data.answer);
                break;
            case "ice":
                // receiveIceCandidate(data.candidate);
                break;
            default:
                break;
        }
    };

    // Function to update host based on number of connected clients
    function updateHost(clientCount) {
        if (clientCount == 1) {
            host = true;
        }
        console.log("Host:", host);
    }

    function setupConnection() {

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
        const newFiles = Array.from(event.target.files);
        setFiles((prevFiles) => [...prevFiles, ...newFiles]);

        console.log('Selected files:', fileArray);
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
                <img src="download-icon.svg" alt="Download" className="download-icon" />
                </li>
            ))}
            </ul>
        </div>
        </div>
    );
}
