import React, { useState } from 'react'
import "../styles/home.css"
import { useNavigate } from 'react-router-dom';

export default function Home() {

    const navigate = useNavigate();
    const [joinCode, setJoinCode] = useState("");

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

    const joinTunnel = () => {
        if (joinCode.length === 6) {
            navigate("/tunnel/" + joinCode);
        } else {
            alert("Please enter a valid 6-character join code.");
        }
    }

    return (
        <div className="App">
          <h1>Bytetunnel</h1>
          <div className="content">
            <div className="panel left-panel">
              <button id="createTunnel" onClick={createTunnel}>Create Tunnel</button>
            </div>
            <div className="panel right-panel">
                    <input
                        type="text"
                        id="joinCodeInput"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        maxLength="6"
                        placeholder="Enter 6-character code"
                    />
                    <button id="joinButton" onClick={joinTunnel}>Join</button>
            </div>
          </div>
        </div>
      );
}
