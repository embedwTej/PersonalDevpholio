# Yogesh Mene | IoT System Engineer & Developer Portfolio

A premium, interactive personal portfolio website designed with a custom **Spider-Man theme** and modern **Bento Grid** layout. This project showcases Yogesh Mene's achievements as an IoT System Engineer, Embedded Hardware Developer, and Frontend Creator, featuring live interactive widgets like an ESP32 Telemetry Monitor, local timezone clock, location radar map, and a Web-Shooter challenge mini-game.

## 🕷️ Theme & Visuals
* **Spider-Man Theme:** Features interactive canvas backgrounds (particle networks, web overlays, mini spiders), web-line cursor followers, and custom Spidey-mask logos.
* **Bento Grid Design:** Modern, responsive dashboard-style layout grouping resume content, location maps, local timezone clocks, and telemetry tools.
* **Rich Aesthetics:** Neon cyan/gold highlights, dark mode, blueprint grid backgrounds, and floating glow orbs for a high-tech/cyberpunk feel.

---

## 🛠️ Technology Stack

### Frontend
* **Core:** Semantic HTML5, Vanilla JavaScript (ES6+), CSS3 (Bento Grid, Custom CSS Variables, Keyframe Animations)
* **Canvas API:** Custom interactive particles, full-page web canvas, and mini-spider cursor follower scripts
* **Maps API:** Leaflet.js with customized dark radar maps for location tracking
* **Fonts & Icons:** Google Fonts (Poppins, Inter, Fira Code) & FontAwesome Icons

### Backend
* **Runtime:** Node.js
* **Framework:** Express.js (serving static files and handling backend APIs)
* **Messaging & Database:** Nodemailer (SMTP email dispatch) + local JSON file database (`messages.json`) for contact submissions

### Deployment
* **Local environment:** dotenv for environment variable injection
* **Production/Cloud:** Pre-configured for **Vercel** (`vercel.json`) with serverless function routing

---

## 🚀 Key Features

* **ESP32 Telemetry Monitor:** An interactive simulator widget showing an OLED SSD1306 display. It features simulated live I2C sensor data (Temperature and Humidity) with a real-time canvas line chart.
* **Spidey Web-Shooter Game:** A built-in web-shooter mini-game modal accessible via the floating badge. Shoot webs to capture items before the timer runs out!
* **Local Timezone Clock:** Displays current local time in Chennai, India (IST), updated every second.
* **Leaflet Location Radar:** Renders an interactive map focused on Chennai with a sonar-like pulsing indicator.
* **Contact & Mailer Portal:** Visitors can send messages through the contact form, which stores the submissions locally in a database file and forwards them to Yogesh's inbox using SMTP.

---

## 💻 Local Setup & Development

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed.

### 2. Installation
Clone this repository and install the dependencies:
```bash
git clone https://github.com/embedwTej/PersonalDevpholio.git
cd PersonalDevpholio
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory and configure your SMTP credentials (you can refer to `.env.example` as a template):
```env
PORT=5000
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
CONTACT_EMAIL=yogeshmene00@gmail.com
```

### 4. Running the App
Start the local development server:
```bash
npm run dev
```
Open [http://localhost:5000](http://localhost:5000) in your browser to inspect the application.

---

## 🌐 Deployment to Vercel

This project is pre-configured to be deployed as a serverless backend + static frontend on **Vercel**.

1. Create a free account on [Vercel](https://vercel.com/) and link your GitHub account.
2. Click **Add New...** -> **Project** -> Select the **`PersonalDevpholio`** repository.
3. Vercel will auto-detect configuration settings from [vercel.json](vercel.json).
4. Add your **Environment Variables** (from your local `.env`) inside the Vercel project dashboard.
5. Click **Deploy**.

*Note: Since Vercel uses ephemeral container storage, the local messages database (`messages.json`) is read-only and resets with each serverless invocation. However, email dispatch via Nodemailer functions perfectly.*
