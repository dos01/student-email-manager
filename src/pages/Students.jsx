import { useState, useEffect, useMemo } from 'react';
import { HiOutlineSearch, HiOutlineTrash, HiOutlinePlus, HiOutlineX } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function Students() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ firstName: '', lastName: '', studentId: '', email: '' });
    const [settings, setSettings] = useState({ institute: { domain: 'institute.edu' }, emailPattern: 'firstname.lastname' });

    useEffect(() => {
        fetchStudents();
        fetch('/api/settings').then(r => r.json()).then(setSettings).catch(() => { });
    }, []);

    function fetchStudents() {
        fetch('/api/students')
            .then((r) => r.json())
            .then((data) => {
                setStudents(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }

    function generateEmail(first, last) {
        const domain = settings.institute?.domain || 'institute.edu';
        const pattern = settings.emailPattern || 'firstname.lastname';
        const f = (first || '').toLowerCase().replace(/\s+/g, '');
        const l = (last || '').toLowerCase().replace(/\s+/g, '');

        switch (pattern) {
            case 'firstname.lastname':
                return l ? `${f}.${l}@${domain}` : `${f}@${domain}`;
            case 'firstname':
                return `${f}@${domain}`;
            case 'firstinitial.lastname':
                return l ? `${f.charAt(0)}.${l}@${domain}` : `${f}@${domain}`;
            case 'studentid':
                return '';
            default:
                return l ? `${f}.${l}@${domain}` : `${f}@${domain}`;
        }
    }

    function handleFormChange(field, value) {
        const updated = { ...form, [field]: value };
        if ((field === 'firstName' || field === 'lastName') && settings.emailPattern !== 'studentid') {
            updated.email = generateEmail(
                field === 'firstName' ? value : form.firstName,
                field === 'lastName' ? value : form.lastName
            );
        }
        setForm(updated);
    }

    async function handleAdd(e) {
        e.preventDefault();
        if (!form.firstName || !form.email) {
            toast.error('First name and email are required');
            return;
        }
        try {
            const res = await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            setStudents((prev) => [...prev, data]);
            setForm({ firstName: '', lastName: '', studentId: '', email: '' });
            setShowModal(false);
            toast.success('Student added successfully!');
        } catch {
            toast.error('Failed to add student');
        }
    }

    async function handleDelete(id) {
        if (!confirm('Remove this student email record?')) return;
        try {
            await fetch(`/api/students/${id}`, { method: 'DELETE' });
            setStudents((prev) => prev.filter((s) => s.id !== id));
            toast.success('Student removed');
        } catch {
            toast.error('Failed to remove student');
        }
    }

    const filtered = useMemo(() => {
        if (!search) return students;
        const q = search.toLowerCase();
        return students.filter(
            (s) =>
                s.firstName.toLowerCase().includes(q) ||
                s.lastName?.toLowerCase().includes(q) ||
                s.email.toLowerCase().includes(q) ||
                s.studentId?.toLowerCase().includes(q)
        );
    }, [students, search]);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <div className="spinner spinner-lg"></div>
            </div>
        );
    }

    return (
        <div className="animate-in">
            <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                    <h2>Students</h2>
                    <p>Manage student email addresses ({students.length} total)</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <HiOutlinePlus /> Add Student
                </button>
            </div>

            {students.length > 0 && (
                <div className="search-box" style={{ marginBottom: 20, maxWidth: 400 }}>
                    <HiOutlineSearch className="search-icon" />
                    <input
                        className="form-input"
                        type="text"
                        placeholder="Search by name, email, or ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            )}

            <div className="card">
                {filtered.length === 0 && students.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">👥</div>
                        <h3>No students yet</h3>
                        <p>Add student email addresses to get started with testing.</p>
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            <HiOutlinePlus /> Add First Student
                        </button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">🔍</div>
                        <h3>No matching students</h3>
                        <p>Try a different search term.</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Student ID</th>
                                    <th>Test Status</th>
                                    <th>Added</th>
                                    <th style={{ width: 60 }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((student) => (
                                    <tr key={student.id}>
                                        <td style={{ fontWeight: 500 }}>
                                            {student.firstName} {student.lastName}
                                        </td>
                                        <td>
                                            <span style={{ color: 'var(--accent-primary)' }}>{student.email}</span>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)' }}>{student.studentId || '—'}</td>
                                        <td>
                                            {student.testStatus === 'success' ? (
                                                <span className="badge badge-success">✓ Verified</span>
                                            ) : student.testStatus === 'sent' ? (
                                                <span className="badge badge-info">→ Sent</span>
                                            ) : student.testStatus === 'failed' ? (
                                                <span className="badge badge-danger">✗ Failed</span>
                                            ) : (
                                                <span className="badge badge-neutral">Not tested</span>
                                            )}
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                            {new Date(student.createdAt).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <button
                                                className="btn btn-ghost btn-icon btn-sm"
                                                onClick={() => handleDelete(student.id)}
                                                title="Remove"
                                            >
                                                <HiOutlineTrash style={{ color: 'var(--accent-danger)' }} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>Add New Student</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                                <HiOutlineX />
                            </button>
                        </div>
                        <form onSubmit={handleAdd}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">First Name *</label>
                                    <input
                                        className="form-input"
                                        type="text"
                                        placeholder="e.g. Saman"
                                        value={form.firstName}
                                        onChange={(e) => handleFormChange('firstName', e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Last Name</label>
                                    <input
                                        className="form-input"
                                        type="text"
                                        placeholder="e.g. Perera"
                                        value={form.lastName}
                                        onChange={(e) => handleFormChange('lastName', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Student ID</label>
                                <input
                                    className="form-input"
                                    type="text"
                                    placeholder="e.g. 2026-001"
                                    value={form.studentId}
                                    onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email Address *</label>
                                <input
                                    className="form-input"
                                    type="email"
                                    placeholder="e.g. saman.perera@institute.edu"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                />
                                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                                    Auto-generated based on your email pattern. You can edit it manually.
                                </p>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    <HiOutlinePlus /> Add Student
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
