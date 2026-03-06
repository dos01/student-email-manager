import { useState, useEffect } from 'react';
import { HiOutlineUsers, HiOutlineMail, HiOutlineCheckCircle, HiOutlineExclamationCircle } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetch('/api/stats')
            .then((r) => r.json())
            .then((data) => {
                setStats(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <div className="spinner spinner-lg"></div>
            </div>
        );
    }

    const safeStats = stats || {
        totalStudents: 0,
        totalTests: 0,
        successfulTests: 0,
        failedTests: 0,
        pendingTests: 0,
        successRate: 0,
        isConfigured: false,
        recentLogs: [],
    };

    return (
        <div className="animate-in">
            <div className="page-header">
                <h2>Dashboard</h2>
                <p>Overview of your student email management system</p>
            </div>

            {!safeStats.isConfigured && (
                <div className="card animate-in" style={{ marginBottom: 24, borderColor: 'rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <HiOutlineExclamationCircle style={{ fontSize: 24, color: 'var(--accent-warning)' }} />
                        <div>
                            <h4 style={{ fontSize: 15, fontWeight: 600 }}>Email not configured</h4>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                                Configure your SMTP and IMAP settings to start sending test emails.
                            </p>
                        </div>
                        <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => navigate('/settings')}>
                            Configure Now →
                        </button>
                    </div>
                </div>
            )}

            <div className="stats-grid">
                <div className="stat-card primary animate-in animate-in-delay-1">
                    <div className="stat-icon"><HiOutlineUsers /></div>
                    <div className="stat-value">{safeStats.totalStudents}</div>
                    <div className="stat-label">Total Students</div>
                </div>
                <div className="stat-card info animate-in animate-in-delay-2">
                    <div className="stat-icon"><HiOutlineMail /></div>
                    <div className="stat-value">{safeStats.totalTests}</div>
                    <div className="stat-label">Emails Tested</div>
                </div>
                <div className="stat-card success animate-in animate-in-delay-3">
                    <div className="stat-icon"><HiOutlineCheckCircle /></div>
                    <div className="stat-value">{safeStats.successRate}%</div>
                    <div className="stat-label">Success Rate</div>
                </div>
                <div className="stat-card warning animate-in animate-in-delay-4">
                    <div className="stat-icon"><HiOutlineExclamationCircle /></div>
                    <div className="stat-value">{safeStats.pendingTests}</div>
                    <div className="stat-label">Pending Checks</div>
                </div>
            </div>

            <div className="card animate-in" style={{ animationDelay: '0.3s' }}>
                <div className="card-header">
                    <h3 className="card-title">Recent Activity</h3>
                    {safeStats.recentLogs.length > 0 && (
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/test-email')}>
                            View All →
                        </button>
                    )}
                </div>
                {safeStats.recentLogs.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📬</div>
                        <h3>No activity yet</h3>
                        <p>Add students and send test emails to see activity here.</p>
                        <button className="btn btn-primary" onClick={() => navigate('/students')}>
                            Add Students →
                        </button>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Email</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {safeStats.recentLogs.map((log) => (
                                    <tr key={log.id}>
                                        <td style={{ fontWeight: 500 }}>{log.studentName}</td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{log.studentEmail}</td>
                                        <td>
                                            <span className={`badge ${log.status === 'received' ? 'badge-success' :
                                                    log.status === 'sent' ? 'badge-info' :
                                                        log.status === 'send_failed' ? 'badge-danger' :
                                                            log.status === 'not_found' ? 'badge-warning' : 'badge-neutral'
                                                }`}>
                                                {log.status === 'received' ? '✓ Received' :
                                                    log.status === 'sent' ? '→ Sent' :
                                                        log.status === 'send_failed' ? '✗ Failed' :
                                                            log.status === 'not_found' ? '? Not Found' : log.status}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                            {new Date(log.sentAt).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
