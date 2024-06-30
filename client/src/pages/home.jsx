import React from 'react'
import "../styles/home.css"
import { useNavigate } from 'react-router-dom';

export default function Home() {

    const navigate = useNavigate();

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

    const createTunnel = () => {
        navigate("/tunnel/"+generateCode());
    }

    return (
        <div className="App">
          <h1>WebRTC File Transfer Service</h1>
          <div className="content">
            <div className="panel left-panel">
              <button id="createTunnel" onClick={createTunnel}>Create Tunnel</button>
            </div>
            <div className="panel right-panel">
              <button id="joinButton">Join</button>
            </div>
          </div>
        </div>
      );
}
