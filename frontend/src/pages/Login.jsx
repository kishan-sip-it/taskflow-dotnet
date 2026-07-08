import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Tera API URL yahan paste kar (Step 3 wala)
const API_BASE_URL = "https://potential-journey-5g9gxr4j6rv9hpg45-5193.app.github.dev/api"; 

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // API Call
            const response = await axios.post(`${API_BASE_URL}/Auth/login`, {
                username: username,
                password: password
            });

            // Token ko localStorage mein save kar
            localStorage.setItem('token', response.data.token);
            
            // Dashboard pe redirect kar
            alert('Login Successful!');
            navigate('/dashboard');

        } catch (err) {
            setError('Invalid username or password!');
            console.error(err);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.heading}>TaskFlow Pro Login</h2>
                {error && <p style={{color: 'red'}}>{error}</p>}
                
                <form onSubmit={handleLogin}>
                    <input 
                        type="text" 
                        placeholder="Username (admin)" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={styles.input}
                        required
                    />
                    <input 
                        type="password" 
                        placeholder="Password (admin123)" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={styles.input}
                        required
                    />
                    <button type="submit" style={styles.button}>Login</button>
                </form>
            </div>
        </div>
    );
}

// Basic CSS styling
const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' },
    card: { padding: '2rem', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', backgroundColor: 'white', width: '300px' },
    heading: { textAlign: 'center', color: '#333', marginBottom: '1.5rem' },
    input: { width: '100%', padding: '10px', margin: '10px 0', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' },
    button: { width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }
};

export default Login;