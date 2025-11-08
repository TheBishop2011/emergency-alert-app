# Emergency Alert Web Application

A comprehensive, AI-powered emergency alert system designed for college campuses and communities. This web application provides immediate emergency assistance with AI guidance, real-time location tracking, and an admin dashboard for emergency management.

## 🚀 Features

### User Features
- **One-Tap SOS Emergency Alert** with multiple emergency type options
- **Real-time Location Tracking** with Google Maps integration
- **AI Emergency Assistant** for immediate guidance before help arrives
- **Secure User Authentication** with JWT tokens
- **Responsive Design** that works on all devices

### Admin Features
- **Real-time Alert Dashboard** with live updates
- **Alert Management** (respond, resolve, track emergencies)
- **Detailed Alert Analytics** and statistics
- **Chatbot Conversation Logs** for each emergency
- **User Management** capabilities

### AI Features
- **Smart Emergency Guidance** using Groq/OpenAI APIs
- **Voice Message Support** (ready for implementation)
- **Context-Aware Responses** based on emergency type
- **Multi-turn Conversations** with chat history

## 🛠️ Technology Stack

### Frontend
- **HTML5, CSS3, JavaScript** (Vanilla)
- **Google Maps JavaScript API**
- **Responsive CSS Grid/Flexbox**

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing

### AI Integration
- **Groq API** (Primary - Fast & Free)
- **OpenAI API** (Fallback)
- **Custom emergency response prompts**

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Google Maps API key
- Groq/OpenAI API key

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd emergency-alert-app