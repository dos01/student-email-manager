import { useState, useEffect } from 'react';
import { HiOutlineSave, HiOutlineCheck, HiOutlineServer } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function Settings({ onConfigChange }) {
    const [settings, setSettings] = useState({
        institute: { name: '', domain: '' },
        smtp: { host: '', port: 587, secure: false, user: '', pass: '' },
        imap: { host: '', port: 993, tls: true, user: '', pass: '' },
        emailPattern: 'firstname.lastname',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testingSmtp, setTestingSmtp] = useState(false);
    const [testingImap, setTestingImap] = useState(false);

    useEffect(() => {
        fetch('/api/settings')
            .then((r) => r.json())
            .then((data) => {
                setSettings((prev) => ({ ...prev, ...data }));
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    function updateField(section, field, value) {
        setSettings((prev) => ({
            ...prev,
            [section]: typeof prev[section] === 'object'
                ? { ...prev[section], [field]: value }
                : value,
        }));
    }

    async function handleSave() {
        setSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            if (!res.ok) throw new Error('Failed to save');
            toast.success('Settings saved!');
            onConfigChange?.(!!settings.smtp.host && !!settings.imap.host);
        } catch {
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    }

    async function testSmtp() {
        setTestingSmtp(true);
        try {
            const res = await fetch('/api/test-connection/smtp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings.smtp),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(data.message);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setTestingSmtp(false);
        }
    }

    async function testImap() {
        setTestingImap(true);
        try {
            const res = await fetch('/api/test-connection/imap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings.imap),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success(data.message);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setTestingImap(false);
        }
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <div className="spinner spinner-lg"></div>
            </div>
        );
    }

    return (
        <div className="animate-in">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h2>Settings</h2>
                    <p>Configure your email server and institute details</p>
                </div>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? (
                        <><div className="spinner" style={{ width: 16, height: 16 }}></div> Saving...</>
                    ) : (
                        <><HiOutlineSave /> Save Settings</>
                    )}
                </button>
            </div>

            {/* Institute Info */}
            <div className="card animate-in" style={{ marginBottom: 24 }}>
                <h3 className="card-title" style={{ marginBottom: 20 }}>🏫 Institute Information</h3>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Institute Name</label>
                        <input
                            className="form-input"
                            type="text"
                            placeholder="e.g. ABC Private Academy"
                            value={settings.institute.name}
                            onChange={(e) => updateField('institute', 'name', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Email Domain</label>
                        <input
                            className="form-input"
                            type="text"
                            placeholder="e.g. abcacademy.edu"
                            value={settings.institute.domain}
                            onChange={(e) => updateField('institute', 'domain', e.target.value)}
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Email Pattern</label>
                    <select
                        className="form-select"
                        value={settings.emailPattern}
                        onChange={(e) => setSettings((prev) => ({ ...prev, emailPattern: e.target.value }))}
                    >
                        <option value="firstname.lastname">firstname.lastname@domain (e.g. saman.perera@domain)</option>
                        <option value="firstname">firstname@domain (e.g. saman@domain)</option>
                        <option value="firstinitial.lastname">firstinitial.lastname@domain (e.g. s.perera@domain)</option>
                        <option value="studentid">Manual / Student ID based</option>
                    </select>
                </div>
            </div>

            {/* SMTP Config */}
            <div className="card animate-in animate-in-delay-1" style={{ marginBottom: 24 }}>
                <div className="card-header">
                    <h3 className="card-title">📤 SMTP Configuration (Outgoing)</h3>
                    <button className="btn btn-ghost btn-sm" onClick={testSmtp} disabled={testingSmtp}>
                        {testingSmtp ? (
                            <><div className="spinner" style={{ width: 14, height: 14 }}></div> Testing...</>
                        ) : (
                            <><HiOutlineServer /> Test Connection</>
                        )}
                    </button>
                </div>
                <div className="form-row-3">
                    <div className="form-group">
                        <label className="form-label">SMTP Host</label>
                        <input
                            className="form-input"
                            type="text"
                            placeholder="e.g. smtp.gmail.com"
                            value={settings.smtp.host}
                            onChange={(e) => updateField('smtp', 'host', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Port</label>
                        <input
                            className="form-input"
                            type="number"
                            placeholder="587"
                            value={settings.smtp.port}
                            onChange={(e) => updateField('smtp', 'port', parseInt(e.target.value) || 587)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Encryption</label>
                        <select
                            className="form-select"
                            value={settings.smtp.secure ? 'ssl' : 'tls'}
                            onChange={(e) => updateField('smtp', 'secure', e.target.value === 'ssl')}
                        >
                            <option value="tls">STARTTLS (Port 587)</option>
                            <option value="ssl">SSL/TLS (Port 465)</option>
                        </select>
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Username / Email</label>
                        <input
                            className="form-input"
                            type="text"
                            placeholder="e.g. admin@yourdomain.com"
                            value={settings.smtp.user}
                            onChange={(e) => updateField('smtp', 'user', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password / App Password</label>
                        <input
                            className="form-input"
                            type="password"
                            placeholder="Enter password"
                            value={settings.smtp.pass}
                            onChange={(e) => updateField('smtp', 'pass', e.target.value)}
                        />
                    </div>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -8 }}>
                    💡 For Gmail, use an <strong>App Password</strong>. Go to Google Account → Security → 2FA → App Passwords.
                </p>
            </div>

            {/* IMAP Config */}
            <div className="card animate-in animate-in-delay-2">
                <div className="card-header">
                    <h3 className="card-title">📥 IMAP Configuration (Incoming — For Verification)</h3>
                    <button className="btn btn-ghost btn-sm" onClick={testImap} disabled={testingImap}>
                        {testingImap ? (
                            <><div className="spinner" style={{ width: 14, height: 14 }}></div> Testing...</>
                        ) : (
                            <><HiOutlineServer /> Test Connection</>
                        )}
                    </button>
                </div>
                <div className="form-row-3">
                    <div className="form-group">
                        <label className="form-label">IMAP Host</label>
                        <input
                            className="form-input"
                            type="text"
                            placeholder="e.g. imap.gmail.com"
                            value={settings.imap.host}
                            onChange={(e) => updateField('imap', 'host', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Port</label>
                        <input
                            className="form-input"
                            type="number"
                            placeholder="993"
                            value={settings.imap.port}
                            onChange={(e) => updateField('imap', 'port', parseInt(e.target.value) || 993)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">TLS</label>
                        <select
                            className="form-select"
                            value={settings.imap.tls ? 'yes' : 'no'}
                            onChange={(e) => updateField('imap', 'tls', e.target.value === 'yes')}
                        >
                            <option value="yes">Yes (Recommended)</option>
                            <option value="no">No</option>
                        </select>
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Username / Email</label>
                        <input
                            className="form-input"
                            type="text"
                            placeholder="e.g. admin@yourdomain.com"
                            value={settings.imap.user}
                            onChange={(e) => updateField('imap', 'user', e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password / App Password</label>
                        <input
                            className="form-input"
                            type="password"
                            placeholder="Enter password"
                            value={settings.imap.pass}
                            onChange={(e) => updateField('imap', 'pass', e.target.value)}
                        />
                    </div>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -8 }}>
                    💡 IMAP is used to check if the test email was received in the student's inbox.
                    The IMAP account should have access to read the inbox of the student email addresses.
                </p>
            </div>
        </div>
    );
}
