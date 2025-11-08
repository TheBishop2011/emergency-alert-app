const express = require('express');
const axios = require('axios');
const Alert = require('../models/Alert');
const router = express.Router();

const SYSTEM_PROMPT = `You are an experienced Emergency Response Phone Operator trained to handle critical situations.
Your role is to guide users calmly and clearly during emergencies involving medical crises, fires, police assistance, or accidents.
You must:
1. Remain calm and assertive.
2. Ask for and confirm key details like location and condition of the person.
3. Provide immediate, practical steps the user can take before help arrives.
4. Share accurate emergency helpline numbers.
5. Never provide medical diagnosis - only first aid guidance.
6. Keep responses clear, short, and actionable.

If the query is not an emergency, respond: "I can only assist with urgent emergency-related issues. Please contact appropriate services for non-emergencies."

Emergency Contacts Reference:
- Medical Emergency: 911 (or local ambulance)
- Fire Department: 911
- Police: 911
- Poison Control: 1-800-222-1222

Use short, direct sentences and an authoritative, supportive tone.`;

router.post('/chat', async (req, res) => {
  try {
    const { message, alertId, chatHistory = [] } = req.body;

    // Format messages for the AI
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...chatHistory,
      { role: "user", content: message }
    ];

    // Try Groq API first (fast and free), fallback to OpenAI format
    let aiResponse;
    try {
      const groqResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
        messages: messages,
        model: "llama3-8b-8192",
        temperature: 0.1,
        max_tokens: 500,
        stream: false
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      aiResponse = groqResponse.data.choices[0].message.content;
    } catch (groqError) {
      console.log('Groq API failed, trying OpenAI format...');

      // Fallback: Use any OpenAI-compatible API
      const openaiResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
        messages: messages,
        model: "gpt-3.5-turbo",
        temperature: 0.1,
        max_tokens: 500
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      aiResponse = openaiResponse.data.choices[0].message.content;
    }

    // If alertId is provided, save the chat log
    if (alertId) {
      await Alert.findByIdAndUpdate(alertId, {
        $push: {
          chatbotLogs: {
            timestamp: new Date(),
            message: message,
            isUser: true
          }
        }
      });

      await Alert.findByIdAndUpdate(alertId, {
        $push: {
          chatbotLogs: {
            timestamp: new Date(),
            message: aiResponse,
            isUser: false
          }
        }
      });
    }

    res.json({ response: aiResponse });
  } catch (error) {
    console.error('Chatbot error:', error);
    
    // Fallback responses if AI service is unavailable
    const fallbackResponses = [
      "I'm currently unavailable. Please call emergency services directly at 911.",
      "Emergency assistance is temporarily unavailable. Dial 911 for immediate help.",
      "I cannot process your request right now. Please contact emergency services directly."
    ];
    
    const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    res.json({ response: randomResponse });
  }
});

module.exports = router;