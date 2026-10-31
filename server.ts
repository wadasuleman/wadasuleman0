import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Initialize Gemini API client if key is present
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI with key:', err);
  }
}

// Educational Space Advisor API Route
app.post('/api/advisor/query', async (req, res) => {
  const { question, state, settings } = req.body || {};

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Question is required' });
  }

  // If Gemini client is available, generate a warm, educational junior astronaut response
  if (aiClient) {
    try {
      const prompt = `You are Commander Luna, a friendly, inspiring senior astronaut flight director guiding children aged 7-12 in the LUNOPS Lunar Operations Simulator.
Current Outpost Telemetry:
- Sol: ${state?.missionSol ?? 1}, Hour: ${state?.missionHour ?? 12}:00
- Oxygen: ${state?.oxygenKg ?? 80} kg
- Water: ${state?.waterLiters ?? 150} L (Recycling: ${state?.waterRecyclingEfficiencyPercent ?? 88}%)
- Battery: ${state?.batteryStorageKwh ?? 40}/${state?.batteryCapacityKwh ?? 60} kWh
- Power Generation: ${state?.powerKwGenerated ?? 12} kW, Consumption: ${state?.powerKwConsumed ?? 8} kW
- Radiation Status: ${state?.radiationStatus ?? 'nominal'}
- Lunar Phase: ${state?.lunarPhase ?? 'peak_light'} (${state?.surfaceTemperatureCelsius ?? 70}°C)

User Question: "${question}"

Instructions:
1. Speak warmly, clearly, and encouragingly in language suitable for a 7-12 year old junior astronaut.
2. Teach authentic NASA space science (e.g., ECLSS water loop, regolith radiation shielding, 1/6th gravity, South Pole peaks of light).
3. Connect the science to a practical tip for their lunar outpost.
4. Keep the answer under 3-4 short sentences. Do not use scary or catastrophic language.
5. Provide a short, fun science fact.

Respond ONLY with valid JSON in this format:
{
  "answer": "Clear, friendly explanation...",
  "suggestedAction": "Practical advice for their base...",
  "funFact": "Fascinating space fact..."
}`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.4
        }
      });

      const responseText = response.text || '';
      try {
        const parsed = JSON.parse(responseText);
        return res.json({
          answer: parsed.answer,
          suggestedAction: parsed.suggestedAction,
          funFact: parsed.funFact
        });
      } catch {
        return res.json({
          answer: responseText,
          suggestedAction: 'Monitor battery reserves and water recycling levels.',
          funFact: 'Water recycled on the Moon can be split into hydrogen fuel and breathable oxygen!'
        });
      }
    } catch (apiError) {
      console.warn('Gemini API call failed, falling back to local rule-based response:', apiError);
      // Fall through to 404/fallback so client uses rule-based engine
      return res.status(503).json({ error: 'AI service unavailable, using local rules' });
    }
  }

  // If no Gemini key, signal to client to use local rule-based engine
  return res.status(503).json({ error: 'No API key configured, using local rule-based engine' });
});

// Mount Vite or static build
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`LUNOPS server running on port ${port} (mode: ${process.env.NODE_ENV || 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start LUNOPS server:', err);
});
