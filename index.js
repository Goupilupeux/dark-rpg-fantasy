const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

let gameState = { day: 1, hour: 8, gold: 2500, morale: 50, messages: [] };

app.post('/api/game/init', (req, res) => {
  res.json({ message: 'Jeu initialise', gameState });
});

app.post('/api/game/action', async (req, res) => {
  const { action } = req.body;
  const poeKey = process.env.POE_API_KEY;
  
  try {
    const response = await axios.post('https://api.poe.com/v1/chat/completions', {
      model: 'claude-3-5-sonnet',
      messages: [{
        role: 'user',
        content: `Tu es un MJ de D&D en francais. Univers: dark fantasy type Berserk. Reponds a cette action: ${action}`
      }]
    }, { headers: { 'Authorization': `Bearer ${poeKey}` } });
    
    const narrative = response.data.choices[0].message.content;
    gameState.messages.push({ role: 'gm', text: narrative });
    res.json({ narration: narrative, speakerName: 'MJ' });
  } catch (error) {
    res.json({ narration: 'Le MJ reflechit... Reessaie.', speakerName: 'MJ' });
  }
});

app.post('/api/tts/speak', async (req, res) => {
  const { text } = req.body;
  const elevenKey = process.env.ELEVENLABS_API_KEY;
  
  try {
    const response = await axios.post(
      'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM',
      { text, model_id: 'eleven_monolingual_v1', voice_settings: { stability: 0.5, similarity_boost: 0.75 } },
      { headers: { 'xi-api-key': elevenKey }, responseType: 'arraybuffer' }
    );
    res.set('Content-Type', 'audio/mpeg');
    res.send(response.data);
  } catch (error) {
    res.status(500).json({ error: 'TTS failed' });
  }
});

app.get('/api/music/ambient', (req, res) => {
  const tracks = {
    tavern: 'https://assets.mixkit.co/active_storage/sfx/1156/1156-preview.mp3',
    ambient: 'https://assets.mixkit.co/active_storage/sfx/931/931-preview.mp3',
    combat: 'https://assets.mixkit.co/active_storage/sfx/897/897-preview.mp3'
  };
  res.json({ url: tracks.ambient });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
