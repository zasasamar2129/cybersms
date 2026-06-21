# 🚀 Cyber SMS Control Panel

> A futuristic, web-based SMS management platform powered by Traccar SMS Gateway and Android devices.

## ✨ Overview

Cyber SMS Control Panel is a modern SMS management platform designed for businesses and power users who want complete control over SMS delivery.

Using an Android phone running Traccar SMS Gateway, the system can send personalized SMS campaigns, manage contacts, track message delivery, and monitor campaigns through a sleek cyber-inspired dashboard.

No expensive SMS providers required. Your Android phone becomes your own SMS gateway.

---

## 🔥 Features

### 📊 Dashboard

* Real-time SMS statistics
* Campaign monitoring
* Success and failure tracking
* Queue status overview
* Live activity feed

### 👥 Contact Management

* CSV import/export
* Search and filtering
* Contact tagging
* Customer grouping
* Duplicate detection

### 💬 Template Engine

Create reusable SMS templates:

```text
Hello {name},

Your payment is due on {due_date}.

Thank you.
```

Supported variables:

* `{name}`
* `{phone}`
* Custom fields

### 📡 Traccar SMS Gateway Integration

* Connect directly to Android devices
* Secure token authentication
* HTTP API communication
* Uses your own SIM card
* No third-party SMS providers required

### 🚀 Campaign System

* Bulk SMS campaigns
* Scheduled campaigns
* Pause / Resume sending
* Retry failed messages
* Real-time progress tracking

### 📈 Analytics

* Delivery statistics
* Success rate tracking
* Campaign history
* Detailed logs

### 🎨 Modern Interface

* Cyber-inspired UI
* Dark Mode
* Light Mode
* Responsive design
* Animated dashboard
* Glassmorphism components

---

# 🏗️ System Architecture

```text
Dashboard
    │
    ▼
Backend API
    │
    ▼
Traccar SMS Gateway
(Android Phone)
    │
    ▼
SIM Card
    │
    ▼
Mobile Network
```

---

# 📱 Traccar SMS Gateway Setup

## Step 1: Install Traccar SMS Gateway

Install Traccar SMS Gateway on your Android phone.

Grant the following permissions:

* SMS
* Notifications
* Network Access
* Background Activity

Disable battery optimization for the app to ensure reliable delivery.

---

## Step 2: Start Gateway Service

Open the application and start the gateway service.

The app will display:

```text
Gateway URL:
http://PHONE_IP:8082

Token:
YOUR_GATEWAY_TOKEN
```

Example:

```text
http://192.168.1.67:8082
```

---

## Step 3: Configure Dashboard

Open:

```text
Settings → SMS Gateway Configuration
```

Enter:

### Gateway URL

```text
http://192.168.1.67:8082
```

### Gateway Token

```text
YOUR_GATEWAY_TOKEN
```

Save settings.

The dashboard will securely use these values for all SMS requests.

---

## Step 4: Test Connection

Navigate to:

```text
Settings → Connection Test
```

The dashboard will:

* Verify gateway availability
* Verify token authentication
* Verify SMS sending capability

If successful, the system status will display:

```text
Gateway Online
```

---

# 🚀 Installation

Clone the repository:

```bash
git clone https://github.com/yourusername/cyber-sms-control-panel.git
```

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# 📂 CSV Import Format

```csv
name,phone
John Doe,+989123456789
Jane Doe,+989987654321
```

---

# 🔐 Security

* JWT Authentication
* Protected Admin Routes
* Secure Gateway Token Storage
* Rate Limiting
* Input Validation
* Campaign Confirmation Protection

---

# ⚠️ Best Practices

* Keep your Android device connected to Wi-Fi.
* Disable battery optimization for Traccar SMS Gateway.
* Use reasonable delays between messages.
* Regularly monitor campaign logs.
* Keep your gateway token private.
* Ensure recipients have consented to receive messages.

---

# 🗺️ Roadmap

* [ ] AI Message Generator
* [ ] Multi-Gateway Support
* [ ] Scheduled Campaign Automation
* [ ] Customer CRM Module
* [ ] Campaign Templates Library
* [ ] Advanced Analytics
* [ ] Multi-User Administration

---

# 💙 Why Cyber SMS Control Panel?

Instead of relying on expensive SMS providers, Cyber SMS Control Panel gives you complete control over your messaging infrastructure by combining:

* A modern web dashboard
* Android-powered SMS delivery
* Traccar SMS Gateway integration
* Real-time campaign management

Your phone becomes your gateway.
Your dashboard becomes mission control.
