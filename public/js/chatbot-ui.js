// AI Chatbot functionality
class EmergencyChatbot {
    constructor() {
        this.isOpen = false;
        this.chatHistory = [];
        this.currentAlertId = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        
        this.init();
    }

    init() {
        this.initEventListeners();
        this.loadChatHistory();
    }

    initEventListeners() {
        // Chatbot toggle
        document.getElementById('chatbotToggle').addEventListener('click', () => this.toggleChatbot());
        document.getElementById('closeChatbot').addEventListener('click', () => this.closeChatbot());
        
        // Message sending
        document.getElementById('sendTextBtn').addEventListener('click', () => this.sendMessage());
        document.getElementById('userInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        
        // Voice recording
        document.getElementById('startVoiceBtn').addEventListener('click', () => this.toggleVoiceRecording());
    }

    toggleChatbot() {
        const container = document.getElementById('chatbotContainer');
        
        if (this.isOpen) {
            this.closeChatbot();
        } else {
            this.openChatbot();
        }
    }

    openChatbot() {
        const container = document.getElementById('chatbotContainer');
        container.classList.remove('hidden');
        this.isOpen = true;
        
        // Scroll to bottom
        this.scrollToBottom();
        
        // Focus on input
        setTimeout(() => {
            document.getElementById('userInput').focus();
        }, 300);
    }

    closeChatbot() {
        const container = document.getElementById('chatbotContainer');
        container.classList.add('hidden');
        this.isOpen = false;
    }

    async sendMessage() {
        const input = document.getElementById('userInput');
        const message = input.value.trim();
        
        if (!message) return;

        // Add user message to chat
        this.addMessageToChat('user', message);
        input.value = '';

        // Show typing indicator
        const typingIndicator = this.showTypingIndicator();

        try {
            const response = await fetch('/api/chatbot/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    alertId: this.currentAlertId,
                    chatHistory: this.chatHistory
                })
            });

            const data = await response.json();

            // Remove typing indicator
            typingIndicator.remove();

            if (response.ok) {
                this.addMessageToChat('ai', data.response);
                this.saveChatHistory();
            } else {
                throw new Error(data.error || 'Failed to get response');
            }
        } catch (error) {
            console.error('Chatbot error:', error);
            typingIndicator.remove();
            this.addMessageToChat('ai', "I'm having trouble connecting right now. Please call emergency services directly at 911 for immediate assistance.");
        }
    }

    addMessageToChat(sender, text) {
        const messagesContainer = document.getElementById('chatbotMessages');
        const messageDiv = document.createElement('div');
        
        messageDiv.className = `message ${sender}-message`;
        messageDiv.innerHTML = `
            <strong>${sender === 'user' ? 'You' : 'Emergency Assistant'}:</strong> ${this.formatMessage(text)}
        `;
        
        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Add to chat history
        this.chatHistory.push({
            role: sender === 'user' ? 'user' : 'assistant',
            content: text,
            timestamp: new Date().toISOString()
        });
        
        // Limit chat history to last 20 messages to avoid token limits
        if (this.chatHistory.length > 20) {
            this.chatHistory = this.chatHistory.slice(-20);
        }
    }

    formatMessage(text) {
        // Convert line breaks to HTML
        return text.replace(/\n/g, '<br>');
    }

    showTypingIndicator() {
        const messagesContainer = document.getElementById('chatbotMessages');
        const typingDiv = document.createElement('div');
        
        typingDiv.className = 'message ai-message typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <strong>Emergency Assistant:</strong> 
            <span class="typing-dots">
                <span>.</span><span>.</span><span>.</span>
            </span>
        `;
        
        messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
        
        return typingDiv;
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('chatbotMessages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async toggleVoiceRecording() {
        if (this.isRecording) {
            await this.stopVoiceRecording();
        } else {
            await this.startVoiceRecording();
        }
    }

    async startVoiceRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };
            
            this.mediaRecorder.onstop = () => {
                this.processAudioRecording();
            };
            
            this.mediaRecorder.start();
            this.isRecording = true;
            
            // Update UI
            const voiceBtn = document.getElementById('startVoiceBtn');
            voiceBtn.textContent = '⏹';
            voiceBtn.classList.add('recording');
            
        } catch (error) {
            console.error('Error starting recording:', error);
            this.addMessageToChat('ai', "Unable to access microphone. Please check your permissions.");
        }
    }

    async stopVoiceRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            this.isRecording = false;
            
            // Update UI
            const voiceBtn = document.getElementById('startVoiceBtn');
            voiceBtn.textContent = '🎤';
            voiceBtn.classList.remove('recording');
        }
    }

    async processAudioRecording() {
        // In a real implementation, you would:
        // 1. Convert audio chunks to a format suitable for speech-to-text
        // 2. Send to a speech-to-text API (Google Speech-to-Text, Whisper, etc.)
        // 3. Process the text and send to chatbot
        
        this.addMessageToChat('ai', "Voice message received. Please type your message for now - voice processing will be implemented in the full version.");
        
        // Placeholder for actual voice processing
        /*
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('audio', audioBlob);
        
        const response = await fetch('/api/chatbot/voice', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        if (response.ok) {
            document.getElementById('userInput').value = data.text;
            this.sendMessage();
        }
        */
    }

    setCurrentAlert(alertId) {
        this.currentAlertId = alertId;
        // Could load previous chat history for this alert
    }

    saveChatHistory() {
        try {
            const key = this.currentAlertId ? `chat_${this.currentAlertId}` : 'chat_general';
            localStorage.setItem(key, JSON.stringify(this.chatHistory));
        } catch (error) {
            console.error('Error saving chat history:', error);
        }
    }

    loadChatHistory() {
        try {
            const key = this.currentAlertId ? `chat_${this.currentAlertId}` : 'chat_general';
            const saved = localStorage.getItem(key);
            
            if (saved) {
                this.chatHistory = JSON.parse(saved);
                
                // Reload messages in UI (for current session)
                // This would need to be implemented based on your UI needs
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }

    clearChatHistory() {
        this.chatHistory = [];
        const messagesContainer = document.getElementById('chatbotMessages');
        messagesContainer.innerHTML = `
            <div class="message ai-message">
                <strong>Emergency Assistant:</strong> Hello! I'm here to help in case of emergency. Please describe your situation and I'll guide you through immediate steps while help is on the way.
            </div>
        `;
        
        this.saveChatHistory();
    }
}

// Initialize chatbot when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatbot = new EmergencyChatbot();
});