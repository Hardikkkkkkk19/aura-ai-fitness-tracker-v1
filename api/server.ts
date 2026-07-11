import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI, Type } from '@google/genai';

// Load environment configurations
dotenv.config();

const app = express();
app.set('trust proxy', true);
const PORT = 3000;

// Security Middleware: Helmet & CORS
app.use(helmet({
  contentSecurityPolicy: false, // Turn off CSP for dev server ease or configure custom if needed
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Initialize Supabase Admin client securely for user authentication checks
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })
  : null;

// Auth Middleware to verify Supabase Access Tokens
export interface AuthenticatedRequest extends Request {
  user?: any;
}

async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // In local sandbox / development, fallback to dummy user to prevent locking out the user
    if (process.env.NODE_ENV !== 'production') {
      req.user = { id: 'sandbox-user-id', email: 'demo@aura.fit', user_metadata: { full_name: 'Alex Rivera' } };
      next();
      return;
    }
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];
  if (!supabaseAdmin) {
    if (process.env.NODE_ENV !== 'production') {
      req.user = { id: 'sandbox-user-id', email: 'demo@aura.fit', user_metadata: { full_name: 'Alex Rivera' } };
      next();
      return;
    }
    res.status(503).json({ error: 'Supabase integration is not configured' });
    return;
  }

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      res.status(401).json({ error: 'Invalid or expired session token' });
      return;
    }
    req.user = user;
    next();
  } catch (err) {
    console.error('Error verifying Supabase token:', err);
    res.status(500).json({ error: 'Internal server error verifying token' });
  }
}

// Multer Storage Configuration in memory for Secure Multipart file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Rate limiting to protect API routes with disabled proxy validations to support container port forwards
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15 mins
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: 'draft-6',
  legacyHeaders: false,
  validate: {
    trustProxy: false,
    xForwardedForHeader: false,
  }
});

// ==========================================
// 1. GROQ AI: Coach Chat Endpoint
// ==========================================
app.post('/api/chat', apiLimiter, requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { prompt, history, stream } = req.body;
  if (!prompt) {
    res.status(400).json({ error: 'Prompt is required' });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    // Elegant fallback if no API key is set
    console.warn('GROQ_API_KEY is not configured. Falling back to sandbox response.');
    res.json({
      text: `### 🌟 Deployed Aura AI Coach Engine (Sandbox Mode)
      
Hello **${req.user?.user_metadata?.full_name || 'Athlete'}**! I received your prompt: "${prompt}"

As your virtual sports coach, here is a professional recommendation:
1. **Consistency**: Aim for progressive overload on major compound splits.
2. **Hydration**: Maintain a standard baseline of 3.5 Liters of water daily.
3. **Synthesis**: Ensure protein intake reaches 1.8g per kg of body weight.

*To unlock full cognitive intelligence, configure your GROQ_API_KEY in the environment secrets!*`
    });
    return;
  }

  const systemInstruction = `You are Aura, an elite, highly professional performance fitness coach in the style of WHOOP, Linear, or Apple Health. 
Your tone is scientific, supportive, brief, clear, and hyper-targeted. Avoid corporate boilerplate. 
Formulate exact exercise configurations (sets, repetition ranges), calculated macro weights (proteins, carbs, fats), and sleep latency recovery insights. 
Use Markdown to format your response beautifully with bold headings and checklists.`;

  const messages = [
    { role: 'system', content: systemInstruction },
    ...(history || []).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content
    })),
    { role: 'user', content: prompt }
  ];

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.7,
        stream: stream === true
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq AI connection error:', errText);
      res.status(response.status).json({ error: 'Groq AI backend failure' });
      return;
    }

    if (stream === true) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      if (!response.body) {
        res.write('data: {"error": "No stream body"}\n\n');
        res.end();
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          res.write(chunk);
        }
      }
      res.end();
    } else {
      const data = await response.json();
      res.json({ text: data.choices?.[0]?.message?.content || '' });
    }
  } catch (err: any) {
    console.error('Groq Chat proxy execution failure:', err);
    res.status(500).json({ error: 'AI generation failed: ' + err.message });
  }
});

// Backwards compatibility mapping for legacy endpoint
app.post('/api/coach/chat', apiLimiter, requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { prompt, history } = req.body;
  // Proxy directly to new /api/chat JSON responder
  req.body.stream = false;
  const originalPrompt = prompt;
  
  // Call the same handler directly or rewrite
  try {
    const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      res.json({
        text: `### 🌟 Smart Sandbox Coach Mode
        
I see your prompt: **"${originalPrompt}"**

As your virtual coach, here is an immediate recommendation:
1. **Consistency**: Progressive overload on major compound movements.
2. **Hydration**: Standard target is 3.5 Liters of water daily.
3. **Synthesis**: Aim for 1.8g of protein per kg of body weight.

*Once you save your Groq API Secrets, my full semantic intelligence will activate!*`
      });
      return;
    }

    const systemInstruction = `You are Aura, an elite, highly professional performance fitness coach in the style of WHOOP, Linear, or Apple Health. 
Your tone is scientific, supportive, brief, clear, and hyper-targeted. Avoid corporate boilerplate. 
Formulate exact exercise configurations (sets, repetition ranges), calculated macro weights (proteins, carbs, fats), and sleep latency recovery insights. 
Use Markdown to format your response beautifully with bold headings and checklists.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemInstruction },
          ...(history || []).map((msg: any) => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content
          })),
          { role: 'user', content: originalPrompt }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error('Groq backend error');
    }
    const data = await response.json();
    res.json({ text: data.choices?.[0]?.message?.content || '' });
  } catch (err: any) {
    res.status(500).json({ error: 'AI Chat proxy error: ' + err.message });
  }
});

// ==========================================
// 2. AI VISION: Meal Macro Analyzer Endpoint
// ==========================================
app.post('/api/meal/analyze', apiLimiter, requireAuth, upload.single('image'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;

    if (!geminiKey && !groqKey) {
      res.status(503).json({ error: 'Vision AI is not configured. Please add your API key.' });
      return;
    }

    let base64Image = '';
    let mimeType = 'image/jpeg';

    if (req.file) {
      base64Image = req.file.buffer.toString('base64');
      mimeType = req.file.mimetype;
    } else if (req.body.image) {
      const imageStr = req.body.image;
      if (imageStr.startsWith('data:')) {
        const matches = imageStr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          base64Image = matches[2];
        } else {
          base64Image = imageStr;
        }
      } else {
        base64Image = imageStr;
      }
    } else {
      res.status(400).json({ error: 'No image uploaded or provided.' });
      return;
    }

    if (geminiKey) {
      // Initialize Gemini Client
      const aiClient = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const imagePart = {
        inlineData: {
          mimeType: mimeType,
          data: base64Image,
        },
      };

      const textPart = {
        text: `Identify the food on this plate. Detect ALL food components/ingredients present in the image. Calculate/estimate detailed nutritional macro breakdown. Estimate health score and confidence score. Generate sport-science insights and coaching recommendations based on the detected food.`,
      };

      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [imagePart, textPart] },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              mealName: { type: Type.STRING },
              calories: { type: Type.INTEGER },
              protein: { type: Type.INTEGER },
              carbs: { type: Type.INTEGER },
              fat: { type: Type.INTEGER },
              fiber: { type: Type.INTEGER },
              sugar: { type: Type.INTEGER },
              sodium: { type: Type.INTEGER, description: "Sodium content in mg" },
              servingSize: { type: Type.STRING },
              confidenceScore: { type: Type.INTEGER, description: "Confidence score from 0 to 100" },
              healthScore: { type: Type.INTEGER, description: "Health score from 0 to 100 based on nutritional value" },
              detectedFoods: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    calories: { type: Type.INTEGER },
                    protein: { type: Type.INTEGER },
                    carbs: { type: Type.INTEGER },
                    fat: { type: Type.INTEGER },
                    confidence: { type: Type.INTEGER }
                  },
                  required: ["name", "calories", "protein", "carbs", "fat", "confidence"]
                }
              },
              insights: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    type: { type: Type.STRING, description: "Must be success, warning, info, or error" },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING }
                  },
                  required: ["id", "type", "title", "description"]
                }
              },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    tag: { type: Type.STRING, description: "A high-level short label like Timing, Hydration, Recovery, Macros" }
                  },
                  required: ["id", "title", "description", "tag"]
                }
              }
            },
            required: [
              "mealName", "calories", "protein", "carbs", "fat", "fiber", "sugar", "sodium",
              "servingSize", "confidenceScore", "healthScore", "detectedFoods", "insights", "recommendations"
            ]
          }
        }
      });

      const content = response.text || '{}';
      res.json(JSON.parse(content));
      return;
    } else {
      // Call Groq Vision Llama model
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.2-11b-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Identify the food on this plate. Provide a detailed nutritional macro breakdown. Return ONLY a valid JSON block with no markdown wrappers or formatting:
{
  "mealName": "Clean Title of the Meal",
  "calories": 520,
  "protein": 34,
  "carbs": 56,
  "fat": 18,
  "fiber": 9,
  "sugar": 5,
  "sodium": 410,
  "servingSize": "340g",
  "confidenceScore": 92,
  "healthScore": 88,
  "detectedFoods": [
    { "name": "Name of Component 1", "calories": 180, "protein": 25, "carbs": 0, "fat": 4, "confidence": 95 }
  ],
  "insights": [
    { "id": "ins_1", "type": "success", "title": "High Protein", "description": "Analysis insight description" }
  ],
  "recommendations": [
    { "id": "rec_1", "title": "Post Workout Timing", "description": "Timing recommendation", "tag": "Timing" }
  ]
}`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          temperature: 0.2
        })
      });

      if (!response.ok) {
        throw new Error('Groq Vision API error');
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '{}';
      const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
      res.json(JSON.parse(cleanJson));
      return;
    }
  } catch (err: any) {
    console.error('AI vision analyze error:', err);
    res.status(500).json({ error: 'Meal scanning vision analytical failure: ' + err.message });
  }
});

// Backwards compatibility mapping for legacy scan endpoint
app.post('/api/coach/scan', apiLimiter, requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  // Proxy body straight into analyze handler
  try {
    const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      res.status(503).json({ error: 'Vision AI is not configured. Please add your API key.' });
      return;
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.2-11b-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Identify the food on this plate. Return a JSON block matching EXACTLY this structure:
{
  "foodName": "Name of the food",
  "calories": 520,
  "protein": 38,
  "carbs": 45,
  "fats": 18,
  "analysis": "Brief elite nutrition summary",
  "confidence": 90
}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: req.body.image
                }
              }
            ]
          }
        ],
        temperature: 0.2
      })
    });

    if (!response.ok) throw new Error('Groq backend error');
    const data = await response.json();
    const cleanJson = data.choices?.[0]?.message?.content?.replace(/```json/g, '').replace(/```/g, '').trim() || '{}';
    res.json(JSON.parse(cleanJson));
  } catch (err: any) {
    res.status(500).json({ error: 'Vision error: ' + err.message });
  }
});

// ==========================================
// 3. RESEND: Email Dispatching Endpoint
// ==========================================
app.post('/api/email/send', apiLimiter, requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { recipient, type, details } = req.body;
  if (!recipient) {
    res.status(400).json({ error: 'Recipient email is required' });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY is not configured. Simulating successful email dispatch.');
    res.json({ success: true, message: `Email of type ${type} simulated successfully to ${recipient}` });
    return;
  }

  const subjects: Record<string, string> = {
    welcome: 'Welcome to Aura Athletic OS - Elevate Your Physiology',
    workout_started: 'Training Protocol Scheduled: Power Up Your Day',
    workout_completed: 'Session Logged: Clean Thermodynamic Release',
    weekly_progress: 'Weekly Microcycle Complete: Physiological Metrics Audit',
    monthly_progress: 'Monthly Macrocycle Summary: Structural Evolution Audit',
    goal_achieved: 'Benchmark Surpassed: Exceptional Athlete Performance',
    streak_celebration: 'Unstoppable Momentum: Streak Milestone Unlocked',
    meal_summary: 'Macro Decomposed: Aura Meal Vision Audit',
    password_reset: 'Security Notice: Account Access Credentials Updated',
    security_alert: 'CRITICAL SECURITY: Unrecognized Workspace Access Attempt'
  };

  const subject = subjects[type] || 'Aura Notification Audit';
  const userName = details?.userName || 'Athlete';
  const htmlContent = generateServerHtmlTemplate(type, userName, details);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Aura Athletic OS <onboarding@resend.dev>',
        to: recipient,
        subject: subject,
        html: htmlContent
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Resend API error:', errText);
      res.status(response.status).json({ error: 'Failed to deliver email via Resend' });
      return;
    }

    const result = await response.json();
    res.json({ success: true, message: 'Email delivered successfully', resendId: result.id });
  } catch (err: any) {
    console.error('Error dispatching email via Resend:', err);
    res.status(500).json({ error: 'Internal server error delivering email: ' + err.message });
  }
});

// Backwards compatibility mappings for legacy email notification routes
app.post('/api/notifications/email', apiLimiter, requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { type, details } = req.body;
  const recipient = details?.userEmail || req.user?.email || 'hvjadhav19@gmail.com';
  
  // Proxy to Resend email endpoint
  try {
    const apiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
    if (!apiKey) {
      res.json({ success: true, message: `Email of type ${type} triggered successfully.` });
      return;
    }

    const subjects: Record<string, string> = {
      welcome: 'Welcome to Aura Athletic OS - Elevate Your Physiology',
      workout_started: 'Training Protocol Scheduled: Power Up Your Day',
      workout_completed: 'Session Logged: Clean Thermodynamic Release',
      weekly_progress: 'Weekly Microcycle Complete: Physiological Metrics Audit',
      goal_achieved: 'Benchmark Surpassed: Exceptional Athlete Performance',
      streak_celebration: 'Unstoppable Momentum: Streak Milestone Unlocked',
      meal_summary: 'Macro Decomposed: Aura Meal Vision Audit'
    };

    const subject = subjects[type] || 'Aura Notification Audit';
    const userName = details?.userName || 'Athlete';
    const htmlContent = generateServerHtmlTemplate(type, userName, details);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Aura Athletic OS <onboarding@resend.dev>',
        to: recipient,
        subject: subject,
        html: htmlContent
      })
    });

    if (!response.ok) throw new Error('Resend dispatch error');
    const result = await response.json();
    res.json({ success: true, resendId: result.id });
  } catch (err: any) {
    res.status(500).json({ error: 'Email delivery failed: ' + err.message });
  }
});

app.post('/api/email/send-test', apiLimiter, requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { recipient, emailType, subject } = req.body;
  
  try {
    const apiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
    if (!apiKey) {
      res.json({ success: true, message: 'Simulated backend delivery pipeline finished.' });
      return;
    }

    const htmlContent = generateServerHtmlTemplate(emailType, 'Athlete', {});
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Aura Athletic OS <onboarding@resend.dev>',
        to: recipient,
        subject: subject || 'Aura Test Dispatch',
        html: htmlContent
      })
    });

    if (!response.ok) throw new Error('Resend test dispatch error');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Test email failed: ' + err.message });
  }
});

// Beautiful server-side HTML Email template builder for Resend
function generateServerHtmlTemplate(type: string, userDisplayName: string, details: any): string {
  const primaryColor = "#4f46e5";
  const accentColor = "#a78bfa";
  const darkBg = "#050505";
  const panelBg = "#0e0e11";
  const textColor = "#d1d5db";
  const white = "#ffffff";

  const emailHeader = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Aura Intelligence</title>
      <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: ${darkBg}; color: ${textColor}; -webkit-font-smoothing: antialiased; }
        .container { max-width: 600px; margin: 40px auto; padding: 0; background-color: ${panelBg}; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.05); overflow: hidden; }
        .header-gradient { background: linear-gradient(135deg, #1e1b4b 0%, #311042 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }
        .logo-text { font-size: 20px; font-weight: 800; letter-spacing: 2px; color: ${white}; margin: 0; text-transform: uppercase; }
        .logo-sub { font-size: 10px; color: ${accentColor}; font-weight: bold; letter-spacing: 3px; text-transform: uppercase; margin-top: 4px; }
        .content-body { padding: 32px 24px; }
        .greeting { font-size: 18px; font-weight: 700; color: ${white}; margin-bottom: 12px; }
        .paragraph { font-size: 14px; line-height: 1.6; color: ${textColor}; margin: 0 0 20px 0; }
        .card { background-color: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.04); border-radius: 16px; padding: 20px; margin-bottom: 24px; }
        .card-title { font-size: 13px; font-weight: bold; text-transform: uppercase; color: ${accentColor}; margin: 0 0 12px 0; letter-spacing: 1px; }
        .stat-grid { display: table; width: 100%; margin-bottom: 12px; }
        .stat-col { display: table-cell; width: 33.33%; text-align: center; padding: 10px 0; }
        .stat-val { font-size: 24px; font-weight: 800; color: ${white}; margin: 0; }
        .stat-lbl { font-size: 10px; text-transform: uppercase; color: #9ca3af; margin: 4px 0 0 0; letter-spacing: 1px; }
        .action-btn { display: inline-block; background: linear-gradient(to right, ${primaryColor}, ${accentColor}); color: ${white} !important; text-decoration: none; padding: 14px 28px; font-size: 13px; font-weight: bold; border-radius: 12px; margin: 10px 0 20px 0; text-align: center; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2); }
        .footer { text-align: center; padding: 32px 24px; border-top: 1px solid rgba(255, 255, 255, 0.05); background-color: rgba(0,0,0,0.2); }
        .social-links { margin-bottom: 16px; }
        .social-icon { display: inline-block; color: ${accentColor}; text-decoration: none; margin: 0 12px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
        .footer-text { font-size: 11px; color: #6b7280; line-height: 1.5; margin: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header-gradient">
          <div class="logo-text">AURA ATHLETIC OS</div>
          <div class="logo-sub">INTELLIGENT PHYSIOLOGICAL SYSTEMS</div>
        </div>
        <div class="content-body">
  `;

  const emailFooter = `
        </div>
        <div class="footer">
          <div class="social-links">
            <a href="#" class="social-icon">Dashboard</a>
            <a href="#" class="social-icon">Expert Coach</a>
            <a href="#" class="social-icon">Support</a>
          </div>
          <p class="footer-text">
            © 2026 Aura Intelligent Athletic Platforms Inc.
          </p>
          <p class="footer-text" style="margin-top: 6px;">
            This transmission is auto-generated based on high-integrity tracking matrices. You can modify notification rules inside the Security Dashboard settings.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (type === 'welcome') {
    return `
      ${emailHeader}
      <div class="greeting">Welcome to the Matrix, Athlete ${userDisplayName}</div>
      <p class="paragraph">
        You have successfully initialized your profile with **Aura Athletic OS v3.5**. We build highly engineered bio-tracking pipelines to convert thermodynamic and training inputs into pristine athletic outcomes.
      </p>
      
      <div class="card">
        <div class="card-title">YOUR POWER SUITE PATHWAY</div>
        <p class="paragraph" style="font-size: 13px; margin-bottom: 10px;">
          ⚡ **AI Workout Builder**: Structured metabolic split creation.
        </p>
        <p class="paragraph" style="font-size: 13px; margin-bottom: 10px;">
          🍳 **Meal Vision Scanner**: Multi-stage visual nutrition breakdown.
        </p>
        <p class="paragraph" style="font-size: 13px; margin-bottom: 0;">
          🧠 **AI Expert Coach**: Dynamic interactive sports nutrition analysis.
        </p>
      </div>

      <center>
        <a href="#" class="action-btn">ACCESS MY DASHBOARD</a>
      </center>
      ${emailFooter}
    `;
  }

  if (type === 'workout_started') {
    return `
      ${emailHeader}
      <div class="greeting">Training Protocol Call: Peak Power Awaits</div>
      <p class="paragraph">
        Greetings ${userDisplayName}. Your scheduled daily workout threshold is approaching. High-integrity consistent microcycles are the cornerstone of athletic evolution.
      </p>

      <div class="card">
        <div class="card-title">SCHEDULED SESSION DETAILS</div>
        <div style="font-size: 15px; font-weight: bold; color: #ffffff; margin-bottom: 8px;">🏋️ ${details?.workoutName || 'Hypertrophy Push Splits'}</div>
        <div style="font-size: 13px; color: #a78bfa; margin-bottom: 12px;">Duration Target: 45 Mins | Intensity: Moderate-High</div>
        <p class="paragraph" style="font-size: 13px; margin: 0;">
          Focus today is clean eccentric muscle control, strict compound press movements, and staying hydrated.
        </p>
      </div>

      <center>
        <a href="#" class="action-btn">LAUNCH TRAINING HUD</a>
      </center>
      ${emailFooter}
    `;
  }

  if (type === 'workout_completed') {
    return `
      ${emailHeader}
      <div class="greeting">Workout Logged: Clean Kinetic Release</div>
      <p class="paragraph">
        Superb execution, <strong>${userDisplayName}</strong>! You have successfully concluded your active training protocol and stored your workout payload.
      </p>

      <div class="card">
        <div class="card-title">SESSION LOG SUMMARY</div>
        <div style="font-size: 15px; font-weight: bold; color: #ffffff; margin-bottom: 4px;">🏋️ ${details?.workoutName || 'Hypertrophy Power Split'}</div>
        <div style="font-size: 12px; color: #a78bfa; margin-bottom: 16px;">Category: ${details?.category || 'Strength'} | Date: ${details?.workoutDate || '2026-07-11'}</div>
        
        <div class="stat-grid" style="margin-bottom: 16px;">
          <div class="stat-col">
            <div class="stat-val" style="color: #f43f5e;">${details?.caloriesBurned || details?.calories || '520'}</div>
            <div class="stat-lbl">CAL BURNT</div>
          </div>
          <div class="stat-col" style="border-left: 1px solid rgba(255,255,255,0.05); border-right: 1px solid rgba(255,255,255,0.05);">
            <div class="stat-val" style="color: #6366f1;">${details?.duration || '42'}</div>
            <div class="stat-lbl">MINUTES</div>
          </div>
          <div class="stat-col">
            <div class="stat-val" style="color: #10b981;">🔥 ${details?.streak || '14'}</div>
            <div class="stat-lbl">DAY STREAK</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">OVERALL METRIC ACCUMULATION</div>
        <div class="stat-grid">
          <div class="stat-col" style="width: 50%;">
            <div class="stat-val" style="font-size: 20px;">${details?.totalCompleted || '18'}</div>
            <div class="stat-lbl">TOTAL WORKOUTS</div>
          </div>
          <div class="stat-col" style="border-left: 1px solid rgba(255,255,255,0.05); width: 50%;">
            <div class="stat-val" style="font-size: 20px; color: #f59e0b;">${details?.totalCalories || '9,820'}</div>
            <div class="stat-lbl">TOTAL CALORIES</div>
          </div>
        </div>
      </div>

      <div class="card" style="border-left: 3px solid #6366f1; background-color: rgba(99, 102, 241, 0.02);">
        <div class="card-title" style="color: #a78bfa;">COACH MOTIVATION SUMMARY</div>
        <p class="paragraph" style="font-size: 13px; font-style: italic; color: #e5e7eb; margin-bottom: 12px; line-height: 1.5;">
          "${details?.motivationalMessage || 'Your commitment translates directly into real biometric evolution. You are constructing a stronger version of yourself day by day.'}"
        </p>
        <p class="paragraph" style="font-size: 13px; font-weight: bold; color: #10b981; margin: 0; line-height: 1.5;">
          "Keep pushing your limits. Every workout brings you one step closer to your goal."
        </p>
      </div>

      <center>
        <a href="#" class="action-btn">VIEW DETAILED ANALYTICS</a>
      </center>
      ${emailFooter}
    `;
  }

  if (type === 'weekly_progress') {
    return `
      ${emailHeader}
      <div class="greeting">Weekly Microcycle Complete: Physiological Metrics Audit</div>
      <p class="paragraph">
        Hello ${userDisplayName}. Your weekly physical data aggregation has successfully finalized. Consistent execution is yielding excellent structural metric enhancements.
      </p>

      <div class="card">
        <div class="card-title">WEEKLY METRICS SYNOPSIS</div>
        <div class="stat-grid" style="margin-bottom: 20px;">
          <div class="stat-col">
            <div class="stat-val">5</div>
            <div class="stat-lbl">Workouts Completed</div>
          </div>
          <div class="stat-col" style="border-left: 1px solid rgba(255,255,255,0.05); border-right: 1px solid rgba(255,255,255,0.05);">
            <div class="stat-val">2,450</div>
            <div class="stat-lbl">Calories Burned</div>
          </div>
          <div class="stat-col">
            <div class="stat-val">210</div>
            <div class="stat-lbl">Workout Minutes</div>
          </div>
        </div>
      </div>
      ${emailFooter}
    `;
  }

  return `
    ${emailHeader}
    <div class="greeting">Aura System Notice: ${type}</div>
    <p class="paragraph">
      Greetings ${userDisplayName}. Strive for continuous evolution and metric maximization.
    </p>
    ${emailFooter}
  `;
}

// ==========================================
// 4. Vite Dev Server vs Production Setup
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Aura Server] Securely running on port ${PORT}`);
  });
}

startServer();
