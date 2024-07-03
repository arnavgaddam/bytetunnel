import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import "../styles/home.css";

const Home = () => {
    const navigate = useNavigate();
    const [joinCode, setJoinCode] = useState("");

    // Function to generate a 6-character pronounceable tunnel code 
    const generateCode = () => {
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
        navigate("/tunnel/" + generateCode());
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
            <header className="header">
                <div className="logo-container">
                    <img src="/logo-no-background.svg" alt="ByteTunnel Logo" className="logo" />
                </div>
                <p>Secure and easy peer to peer file transfer.</p>
            </header>
            <div className="content">
                <section className="panel left-panel">
                    <h2>Create a Tunnel</h2>
                    <button id="createTunnel" onClick={createTunnel}>Create Tunnel</button>
                </section>
                <section className="panel right-panel">
                    <h2>Join a Tunnel</h2>
                    <input
                        type="text"
                        id="joinCodeInput"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                        maxLength="6"
                        placeholder="Enter 6-character code"
                    />
                    <button id="joinButton" onClick={joinTunnel}>Join</button>
                </section>
            </div>
        </div>
    );
}

export default Home;
