# EduMail 📧 - Student Email Management System

A modern, full-stack web application designed for educational institutes to manage and verify student email addresses. EduMail provides a simple interface to manage student records, configure custom SMTP/IMAP servers, and send/verify test emails.

## ✨ Features

*   **Modern UI/UX**: Built with React and features a stunning, responsive dark mode design utilizing glassmorphism effects.
*   **Student Management**: Add, view, and remove student records (Name, Student ID, Email).
*   **Custom SMTP/IMAP Setup**: Configure your institute's own email server directly from the settings page.
*   **Email Verification Test**: Send beautiful HTML test emails to students with unique tracking IDs.
*   **Inbox Checking**: Connect to an IMAP server to programmatically check if the test email successfully arrived in the student's inbox.
*   **Real-time Dashboard**: View statistics on total students, total tests sent, and success rates.

## 🛠️ Tech Stack

### Frontend
*   **React 19** - UI Library
*   **Vite** - Build Tool & Development Server
*   **React Router** - Navigation
*   **React Hot Toast** - Notifications
*   **React Icons** - Vector Icons
*   **CSS3** - Custom styling with CSS variables and modern layout techniques

### Backend
*   **Node.js & Express** - Server Framework
*   **Nodemailer** - Sending SMTP test emails
*   **Imap-Simple & Mailparser** - Reading IMAP inboxes for verification
*   **File System (fs)** - Lightweight JSON-based data storage (`server/data/*.json`)

## 🚀 Getting Started

### Prerequisites
*   [Node.js](https://nodejs.org/) (v16.x or higher)
*   npm (included with Node.js)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/dos01/student-email-manager.git
    cd student-email-manager
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the development servers**
    This command will start both the React frontend (Vite) and the Express backend concurrently.
    ```bash
    npm run dev
    ```

4.  **Open the App**
    Visit `http://localhost:5173` in your browser. The backend api runs on `http://localhost:3001`.

## ⚙️ Configuration Help (Gmail Example)

If you are using a standard Gmail account for the SMTP and IMAP servers, you should configure it as follows in the Settings page:

1.  **SMTP**:
    *   Host: `smtp.gmail.com`
    *   Port: `587`
    *   Encryption: `STARTTLS`
2.  **IMAP**:
    *   Host: `imap.gmail.com`
    *   Port: `993`
    *   TLS: `Yes`

> **Note**: For Google/Gmail accounts, you **MUST** use an "App Password". Go to your Google Account Settings -> Security -> 2-Step Verification -> App Passwords to generate one.

## 📁 Project Structure

```
student-email-manager/
├── server/
│   ├── data/           # JSON files for database storage (gitignored)
│   └── server.js       # Express server and API endpoints (SMTP/IMAP logic)
├── src/
│   ├── assets/         # Static assets
│   ├── pages/          # React page components (Dashboard, Settings, Students, TestEmail)
│   ├── App.jsx         # Main application component & routing
│   ├── index.css       # Global styles and themes
│   └── main.jsx        # React entrypoint
├── public/             # Public assets
├── package.json        # Dependencies and scripts
└── vite.config.js      # Vite configuration
```

## 📜 License

This project is open-source and ready for educational use.
