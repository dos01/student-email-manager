import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import imapSimple from 'imap-simple';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// --- Data helpers ---
const dataDir = path.join(__dirname, 'data');

function readJSON(file) {
    try {
        return JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf-8'));
    } catch {
        return file === 'students.json' || file === 'test-logs.json' ? [] : {};
    }
}

function writeJSON(file, data) {
    fs.writeFileSync(path.join(dataDir, file), JSON.stringify(data, null, 2));
}

// ===================== STUDENTS =====================

app.get('/api/students', (req, res) => {
    const students = readJSON('students.json');
    res.json(students);
});

app.post('/api/students', (req, res) => {
    const { firstName, lastName, studentId, email } = req.body;
    if (!firstName || !email) {
        return res.status(400).json({ error: 'First name and email are required' });
    }
    const students = readJSON('students.json');
    const newStudent = {
        id: uuidv4(),
        firstName,
        lastName: lastName || '',
        studentId: studentId || '',
        email,
        createdAt: new Date().toISOString(),
        lastTested: null,
        testStatus: null, // 'success' | 'failed' | null
    };
    students.push(newStudent);
    writeJSON('students.json', students);
    res.status(201).json(newStudent);
});

app.delete('/api/students/:id', (req, res) => {
    let students = readJSON('students.json');
    const idx = students.findIndex((s) => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Student not found' });
    students.splice(idx, 1);
    writeJSON('students.json', students);
    res.json({ success: true });
});

// ===================== SETTINGS =====================

app.get('/api/settings', (req, res) => {
    const settings = readJSON('settings.json');
    res.json(settings);
});

app.post('/api/settings', (req, res) => {
    const settings = req.body;
    writeJSON('settings.json', settings);
    res.json({ success: true });
});

// ===================== TEST EMAIL =====================

app.post('/api/test-email/send', async (req, res) => {
    const { studentId } = req.body;
    const students = readJSON('students.json');
    const settings = readJSON('settings.json');
    const student = students.find((s) => s.id === studentId);

    if (!student) return res.status(404).json({ error: 'Student not found' });
    if (!settings.smtp?.host || !settings.smtp?.user) {
        return res.status(400).json({ error: 'SMTP not configured. Go to Settings to configure.' });
    }

    const testId = uuidv4().slice(0, 8);
    const subject = `[EduMail Test] Verification #${testId}`;
    const body = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 30px; color: white; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">📧 EduMail Test</h1>
        <p style="margin: 10px 0 0; opacity: 0.9;">Email Verification Test</p>
      </div>
      <div style="background: #f8f9fa; border-radius: 12px; padding: 25px; margin-top: 20px;">
        <h2 style="color: #333; margin-top: 0;">Hello ${student.firstName}!</h2>
        <p style="color: #666;">This is a test email to verify that your student email address <strong>${student.email}</strong> is working correctly.</p>
        <div style="background: white; border-radius: 8px; padding: 15px; margin: 15px 0; border-left: 4px solid #667eea;">
          <p style="margin: 0; color: #333;"><strong>Test ID:</strong> ${testId}</p>
          <p style="margin: 5px 0 0; color: #333;"><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p style="color: #999; font-size: 13px; margin-bottom: 0;">This email was sent by the Student Email Management System.</p>
      </div>
    </div>
  `;

    try {
        const transporter = nodemailer.createTransport({
            host: settings.smtp.host,
            port: settings.smtp.port,
            secure: settings.smtp.secure,
            auth: {
                user: settings.smtp.user,
                pass: settings.smtp.pass,
            },
        });

        await transporter.sendMail({
            from: `"EduMail Test" <${settings.smtp.user}>`,
            to: student.email,
            subject,
            html: body,
        });

        // Update student test status
        const idx = students.findIndex((s) => s.id === studentId);
        students[idx].lastTested = new Date().toISOString();
        students[idx].testStatus = 'sent';
        writeJSON('students.json', students);

        // Log the test
        const logs = readJSON('test-logs.json');
        logs.unshift({
            id: uuidv4(),
            testId,
            studentId,
            studentName: `${student.firstName} ${student.lastName}`.trim(),
            studentEmail: student.email,
            subject,
            status: 'sent',
            sentAt: new Date().toISOString(),
            checkedAt: null,
            received: null,
        });
        writeJSON('test-logs.json', logs);

        res.json({ success: true, testId, message: `Test email sent to ${student.email}` });
    } catch (err) {
        // Log failure
        const logs = readJSON('test-logs.json');
        logs.unshift({
            id: uuidv4(),
            testId,
            studentId,
            studentName: `${student.firstName} ${student.lastName}`.trim(),
            studentEmail: student.email,
            subject,
            status: 'send_failed',
            sentAt: new Date().toISOString(),
            checkedAt: null,
            received: null,
            error: err.message,
        });
        writeJSON('test-logs.json', logs);

        res.status(500).json({ error: `Failed to send email: ${err.message}` });
    }
});

app.post('/api/test-email/check', async (req, res) => {
    const { testId, studentEmail } = req.body;
    const settings = readJSON('settings.json');

    if (!settings.imap?.host || !settings.imap?.user) {
        return res.status(400).json({ error: 'IMAP not configured. Go to Settings to configure.' });
    }

    const config = {
        imap: {
            user: settings.imap.user,
            password: settings.imap.pass,
            host: settings.imap.host,
            port: settings.imap.port,
            tls: settings.imap.tls,
            authTimeout: 10000,
            tlsOptions: { rejectUnauthorized: false },
        },
    };

    try {
        const connection = await imapSimple.connect(config);
        await connection.openBox('INBOX');

        const searchCriteria = ['ALL', ['SUBJECT', testId]];
        const fetchOptions = { bodies: ['HEADER'], struct: true };
        const messages = await connection.search(searchCriteria, fetchOptions);

        connection.end();

        const found = messages.length > 0;

        // Update log
        const logs = readJSON('test-logs.json');
        const logIdx = logs.findIndex((l) => l.testId === testId);
        if (logIdx !== -1) {
            logs[logIdx].checkedAt = new Date().toISOString();
            logs[logIdx].status = found ? 'received' : 'not_found';
            logs[logIdx].received = found;
            writeJSON('test-logs.json', logs);
        }

        // Update student
        if (found) {
            const students = readJSON('students.json');
            const sIdx = students.findIndex((s) => s.email === studentEmail);
            if (sIdx !== -1) {
                students[sIdx].testStatus = 'success';
                writeJSON('students.json', students);
            }
        }

        res.json({
            found,
            message: found
                ? `✅ Test email (ID: ${testId}) was found in the inbox!`
                : `❌ Test email (ID: ${testId}) was not found yet. It may take a few minutes.`,
        });
    } catch (err) {
        res.status(500).json({ error: `IMAP check failed: ${err.message}` });
    }
});

// Test SMTP connection
app.post('/api/test-connection/smtp', async (req, res) => {
    const { host, port, secure, user, pass } = req.body;
    try {
        const transporter = nodemailer.createTransport({
            host, port, secure,
            auth: { user, pass },
        });
        await transporter.verify();
        res.json({ success: true, message: 'SMTP connection successful!' });
    } catch (err) {
        res.status(500).json({ error: `SMTP connection failed: ${err.message}` });
    }
});

// Test IMAP connection
app.post('/api/test-connection/imap', async (req, res) => {
    const { host, port, tls, user, pass } = req.body;
    try {
        const connection = await imapSimple.connect({
            imap: {
                user, password: pass, host, port, tls,
                authTimeout: 10000,
                tlsOptions: { rejectUnauthorized: false },
            },
        });
        connection.end();
        res.json({ success: true, message: 'IMAP connection successful!' });
    } catch (err) {
        res.status(500).json({ error: `IMAP connection failed: ${err.message}` });
    }
});

// Get test logs
app.get('/api/test-logs', (req, res) => {
    const logs = readJSON('test-logs.json');
    res.json(logs.slice(0, 50)); // Return latest 50
});

// Dashboard stats
app.get('/api/stats', (req, res) => {
    const students = readJSON('students.json');
    const logs = readJSON('test-logs.json');
    const settings = readJSON('settings.json');

    const totalStudents = students.length;
    const totalTests = logs.length;
    const successfulTests = logs.filter((l) => l.received === true).length;
    const failedTests = logs.filter((l) => l.status === 'send_failed').length;
    const pendingTests = logs.filter((l) => l.status === 'sent').length;
    const successRate = totalTests > 0 ? Math.round((successfulTests / totalTests) * 100) : 0;
    const isConfigured = !!(settings.smtp?.host && settings.imap?.host);

    res.json({
        totalStudents,
        totalTests,
        successfulTests,
        failedTests,
        pendingTests,
        successRate,
        isConfigured,
        recentLogs: logs.slice(0, 10),
    });
});

app.listen(PORT, () => {
    console.log(`🚀 EduMail server running on http://localhost:${PORT}`);
});
