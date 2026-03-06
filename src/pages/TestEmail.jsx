import { useState, useEffect } from 'react';
import { HiOutlinePaperAirplane, HiOutlineInbox, HiOutlineRefresh } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function TestEmail() {
    const [students, setStudents] = useState([]);
    const [logs, setLogs] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [sending, setSending] = useState(false);
    const [checking, setChecking] = useState(false);
    const [lastTestId, setLastTestId] = useState(null);
    const [lastStudentEmail, setLastStudentEmail] = useState(null);
    const [sendResult, setSendResult] = useState(null);
    const [checkResult, setCheckResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/students').then((r) => r.json()),
            fetch('/api/test-logs').then((r) => r.json()),
        ]).then(([s, l]) => {
            setStudents(s);
            setLogs(l);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    function refreshLogs() {
        fetch('/api/test-logs').then((r) => r.json()).then(setLogs).catch(() => { });
    }

    async function handleSend() {
        if (!selectedStudent) {
            toast.error('Please select a student');
            return;
        }
        setSending(true);
        setSendResult(null);
        setCheckResult(null);
        setLastTestId(null);
        const student = students.find((s) => s.id === selectedStudent);

        try {
            const res = await fetch('/api/test-email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId: selectedStudent }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setSendResult({ success: true, message: data.message, testId: data.testId });
            setLastTestId(data.testId);
            setLastStudentEmail(student?.email);
            toast.success('Test email sent!');
            refreshLogs();
        } catch (err) {
            setSendResult({ success: false, message: err.message });
            toast.error(`Send failed: ${err.message}`);
        } finally {
            setSending(false);
        }
    }

    async function handleCheck() {
        if (!lastTestId) {
            toast.error('Send a test email first');
            return;
        }
        setChecking(true);
        setCheckResult(null);

        try {
            const res = await fetch('/api/test-email/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ testId: lastTestId, studentEmail: lastStudentEmail }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setCheckResult({ found: data.found, message: data.message });
            if (data.found) {
                toast.success('Email verified!');
            } else {
                toast('Email not found yet — try again in a minute', { icon: '⏳' });
            }
            refreshLogs();
        } catch (err) {
            setCheckResult({ found: false, message: err.message });
            toast.error(`Check failed: ${err.message}`);
        } finally {
            setChecking(false);
        }
    }

    const selectedStudentData = students.find((s) => s.id === selectedStudent);

    // Determine step states
    const step1State = selectedStudent ? 'completed' : 'active';
    const step2State = !selectedStudent ? '' : sendResult?.success ? 'completed' : sending ? 'active' : selectedStudent ? 'active' : '';
    const step3State = !sendResult?.success ? '' : checkResult ? 'completed' : checking ? 'active' : 'active';

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <div className="spinner spinner-lg"></div>
            </div>
        );
    }

    return (
        <div className="animate-in">
            <div className="page-header">
                <h2>Test Email</h2>
                <p>Send a test email and verify delivery to a student address</p>
            </div>

            {students.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-icon">📨</div>
                        <h3>No students to test</h3>
                        <p>Add students first, then come back here to test their email addresses.</p>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    {/* Left: Test Flow */}
                    <div>
                        <div className="card" style={{ marginBottom: 20 }}>
                            <h3 className="card-title" style={{ marginBottom: 20 }}>Email Test Flow</h3>
                            <div className="test-flow">
                                {/* Step 1: Select Student */}
                                <div className={`test-step ${step1State}`}>
                                    <div className="step-number">{selectedStudent ? '✓' : '1'}</div>
                                    <div className="step-content">
                                        <h4>Select a Student</h4>
                                        <p style={{ marginBottom: 10 }}>Choose which student email to test</p>
                                        <select
                                            className="form-select"
                                            value={selectedStudent}
                                            onChange={(e) => {
                                                setSelectedStudent(e.target.value);
                                                setSendResult(null);
                                                setCheckResult(null);
                                                setLastTestId(null);
                                            }}
                                        >
                                            <option value="">-- Select student --</option>
                                            {students.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.firstName} {s.lastName} — {s.email}
                                                </option>
                                            ))}
                                        </select>
                                        {selectedStudentData && (
                                            <div style={{
                                                marginTop: 12, padding: '10px 14px', background: 'rgba(102, 126, 234, 0.08)',
                                                borderRadius: 8, fontSize: 13
                                            }}>
                                                Sending to: <strong style={{ color: 'var(--accent-primary)' }}>{selectedStudentData.email}</strong>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Step 2: Send Email */}
                                <div className={`test-step ${step2State}`}>
                                    <div className="step-number">{sendResult?.success ? '✓' : '2'}</div>
                                    <div className="step-content">
                                        <h4>Send Test Email</h4>
                                        <p style={{ marginBottom: 10 }}>Send a verification email via SMTP</p>
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleSend}
                                            disabled={!selectedStudent || sending}
                                        >
                                            {sending ? (
                                                <><div className="spinner" style={{ width: 16, height: 16 }}></div> Sending...</>
                                            ) : (
                                                <><HiOutlinePaperAirplane /> Send Test Email</>
                                            )}
                                        </button>
                                        {sendResult && (
                                            <div style={{
                                                marginTop: 12, padding: '10px 14px',
                                                background: sendResult.success ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                                                borderRadius: 8, fontSize: 13,
                                                color: sendResult.success ? 'var(--accent-success)' : 'var(--accent-danger)',
                                            }}>
                                                {sendResult.message}
                                                {sendResult.testId && (
                                                    <div style={{ marginTop: 4, color: 'var(--text-muted)' }}>
                                                        Test ID: <code>{sendResult.testId}</code>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Step 3: Check Inbox */}
                                <div className={`test-step ${step3State}`}>
                                    <div className="step-number">{checkResult?.found ? '✓' : '3'}</div>
                                    <div className="step-content">
                                        <h4>Check Inbox</h4>
                                        <p style={{ marginBottom: 10 }}>Verify the email arrived via IMAP</p>
                                        <button
                                            className="btn btn-success"
                                            onClick={handleCheck}
                                            disabled={!lastTestId || checking}
                                        >
                                            {checking ? (
                                                <><div className="spinner" style={{ width: 16, height: 16 }}></div> Checking...</>
                                            ) : (
                                                <><HiOutlineInbox /> Check Inbox</>
                                            )}
                                        </button>
                                        {checkResult && (
                                            <div style={{
                                                marginTop: 12, padding: '10px 14px',
                                                background: checkResult.found ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                                                borderRadius: 8, fontSize: 13,
                                                color: checkResult.found ? 'var(--accent-success)' : 'var(--accent-warning)',
                                            }}>
                                                {checkResult.message}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Test Logs */}
                    <div>
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Test History</h3>
                                <button className="btn btn-ghost btn-sm" onClick={refreshLogs}>
                                    <HiOutlineRefresh /> Refresh
                                </button>
                            </div>
                            {logs.length === 0 ? (
                                <div className="empty-state" style={{ padding: '40px 20px' }}>
                                    <div className="empty-icon">📋</div>
                                    <h3>No tests yet</h3>
                                    <p>Send your first test email to see results here.</p>
                                </div>
                            ) : (
                                <div style={{ maxHeight: 500, overflowY: 'auto' }}>
                                    {logs.map((log) => (
                                        <div
                                            key={log.id}
                                            style={{
                                                padding: '14px 16px',
                                                borderBottom: '1px solid var(--border-color)',
                                                transition: 'background 0.15s',
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                <span style={{ fontWeight: 500, fontSize: 14 }}>{log.studentName}</span>
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
                                            </div>
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                                {log.studentEmail} · Test #{log.testId} · {new Date(log.sentAt).toLocaleString()}
                                            </div>
                                            {log.error && (
                                                <div style={{ fontSize: 12, color: 'var(--accent-danger)', marginTop: 4 }}>
                                                    Error: {log.error}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
