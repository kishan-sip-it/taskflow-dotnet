import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = "https://potential-journey-5g9gxr4j6rv9hpg45-5193.app.github.dev/api";

function Dashboard() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/Task`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setTasks(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    // Stats calculate kar
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'Pending').length;
    const inProgressTasks = tasks.filter(t => t.status === 'InProgress').length;

    if (loading) return <div style={styles.loading}>Loading...</div>;

    return (
        <div style={styles.container}>
            <nav style={styles.navbar}>
                <h1 style={styles.logo}>TaskFlow Pro</h1>
                <div>
                    <button onClick={() => navigate('/board')} style={styles.navButton}>Kanban Board</button>
                    <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
                </div>
            </nav>

            <div style={styles.content}>
                <h2 style={styles.heading}>Dashboard</h2>
                
                {/* Stats Cards */}
                <div style={styles.statsGrid}>
                    <div style={{...styles.statCard, backgroundColor: '#3498db'}}>
                        <h3>Total Tasks</h3>
                        <p style={styles.statNumber}>{totalTasks}</p>
                    </div>
                    <div style={{...styles.statCard, backgroundColor: '#2ecc71'}}>
                        <h3>Completed</h3>
                        <p style={styles.statNumber}>{completedTasks}</p>
                    </div>
                    <div style={{...styles.statCard, backgroundColor: '#f39c12'}}>
                        <h3>In Progress</h3>
                        <p style={styles.statNumber}>{inProgressTasks}</p>
                    </div>
                    <div style={{...styles.statCard, backgroundColor: '#e74c3c'}}>
                        <h3>Pending</h3>
                        <p style={styles.statNumber}>{pendingTasks}</p>
                    </div>
                </div>

                {/* Tasks List */}
                <div style={styles.tasksSection}>
                    <h3>Recent Tasks</h3>
                    {tasks.length === 0 ? (
                        <p style={styles.noTasks}>No tasks found. Create some tasks!</p>
                    ) : (
                        <div style={styles.taskList}>
                            {tasks.map(task => (
                                <div key={task.id} style={styles.taskItem}>
                                    <div>
                                        <h4 style={styles.taskTitle}>{task.title}</h4>
                                        <p style={styles.taskStatus}>Status: {task.status}</p>
                                    </div>
                                    <span style={{
                                        ...styles.statusBadge,
                                        backgroundColor: task.status === 'Completed' ? '#2ecc71' : 
                                                       task.status === 'InProgress' ? '#f39c12' : '#e74c3c'
                                    }}>
                                        {task.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: { minHeight: '100vh', backgroundColor: '#f5f6fa' },
    navbar: { 
        backgroundColor: '#2c3e50', 
        padding: '1rem 2rem', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    logo: { color: 'white', margin: 0 },
    navButton: { 
        padding: '8px 16px', 
        marginRight: '10px',
        backgroundColor: '#3498db', 
        color: 'white', 
        border: 'none', 
        borderRadius: '5px',
        cursor: 'pointer'
    },
    logoutButton: { 
        padding: '8px 16px', 
        backgroundColor: '#e74c3c', 
        color: 'white', 
        border: 'none', 
        borderRadius: '5px',
        cursor: 'pointer'
    },
    content: { padding: '2rem', maxWidth: '1200px', margin: '0 auto' },
    heading: { color: '#2c3e50', marginBottom: '2rem' },
    statsGrid: { 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem',
        marginBottom: '2rem'
    },
    statCard: { 
        padding: '1.5rem', 
        borderRadius: '10px', 
        color: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    statNumber: { fontSize: '2.5rem', fontWeight: 'bold', margin: '10px 0 0 0' },
    tasksSection: { 
        backgroundColor: 'white', 
        padding: '1.5rem', 
        borderRadius: '10px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    taskList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    taskItem: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '5px',
        border: '1px solid #dee2e6'
    },
    taskTitle: { margin: '0 0 5px 0', color: '#2c3e50' },
    taskStatus: { margin: 0, color: '#7f8c8d', fontSize: '0.9rem' },
    statusBadge: {
        padding: '5px 10px',
        borderRadius: '15px',
        color: 'white',
        fontSize: '0.8rem',
        fontWeight: 'bold'
    },
    noTasks: { textAlign: 'center', color: '#7f8c8d', padding: '2rem' },
    loading: { 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.5rem',
        color: '#2c3e50'
    }
};

export default Dashboard;