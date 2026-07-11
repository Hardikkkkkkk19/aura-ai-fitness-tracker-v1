import { supabase } from './supabase';

export interface FoodDetection {
  name: string;
  calories: number;
  protein: number; // in grams
  carbs: number; // in grams
  fat: number; // in grams
  confidence: number; // percentage
}

export interface MealInsight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  description: string;
}

export interface MealRecommendation {
  id: string;
  title: string;
  description: string;
  tag: string;
}

export interface MealScanResult {
  id: string;
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number; // mg
  servingSize: string;
  confidenceScore: number;
  healthScore: number; // 0-100
  imageUrl: string;
  scanDate: string;
  detectedFoods: FoodDetection[];
  insights: MealInsight[];
  recommendations: MealRecommendation[];
}

const STORAGE_KEY = 'aura_meal_scan_history';

export const MEAL_PRESETS: { name: string; url: string; result: Omit<MealScanResult, 'id' | 'imageUrl' | 'scanDate'> }[] = [
  {
    name: "Grilled Salmon Bento Bowl",
    url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
    result: {
      mealName: "Grilled Salmon Bento Bowl with Quinoa & Avocado",
      calories: 580,
      protein: 42,
      carbs: 45,
      fat: 24,
      fiber: 8,
      sugar: 4,
      sodium: 480,
      servingSize: "380g",
      confidenceScore: 98,
      healthScore: 92,
      detectedFoods: [
        { name: "Grilled Atlantic Salmon", calories: 280, protein: 32, carbs: 0, fat: 16, confidence: 99 },
        { name: "White Quinoa", calories: 150, protein: 5, carbs: 28, fat: 2.5, confidence: 96 },
        { name: "Hass Avocado", calories: 120, protein: 1.5, carbs: 6, fat: 11, confidence: 98 },
        { name: "Edamame & Mixed Greens", calories: 30, protein: 3.5, carbs: 11, fat: 0.5, confidence: 95 }
      ],
      insights: [
        { id: "ins_1", type: "success", title: "High Protein", description: "Excellent lean protein dosage (42g) to optimize muscle hypertrophy and recovery splits." },
        { id: "ins_2", type: "success", title: "Balanced Macros", description: "Almost perfect ratio of slow carbs, lean proteins, and high-quality monounsaturated fats." },
        { id: "ins_3", type: "info", title: "Rich in Omega-3s", description: "The salmon provides a dense source of anti-inflammatory EPA and DHA essential fatty acids." }
      ],
      recommendations: [
        { id: "rec_1", title: "Perfect Post Workout Meal", description: "Ideal to consume within 90 minutes post-training to trigger protein synthesis and restore muscle glycogen.", tag: "Timing" },
        { id: "rec_2", title: "Optimal Hydration", description: "Due to the moderate sodium content, consume 500ml of water to maintain fluid electrolyte balance.", tag: "Hydration" }
      ]
    }
  },
  {
    name: "Classic Avocado Toast & Eggs",
    url: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80",
    result: {
      mealName: "Sourdough Avocado Toast with Poached Eggs",
      calories: 460,
      protein: 22,
      carbs: 34,
      fat: 26,
      fiber: 7,
      sugar: 2,
      sodium: 520,
      servingSize: "260g",
      confidenceScore: 96,
      healthScore: 85,
      detectedFoods: [
        { name: "Sourdough Bread (2 slices)", calories: 180, protein: 6, carbs: 32, fat: 1, confidence: 98 },
        { name: "Poached Eggs (2 large)", calories: 140, protein: 12, carbs: 0.8, fat: 10, confidence: 99 },
        { name: "Mashed Avocado", calories: 130, protein: 1.5, carbs: 6, fat: 12, confidence: 95 },
        { name: "Olive oil drizzle & seasoning", calories: 10, protein: 0, carbs: 0, fat: 3, confidence: 90 }
      ],
      insights: [
        { id: "ins_toast_1", type: "success", title: "High-Quality Fats", description: "Avocado fats are primarily monounsaturated, ideal for metabolic regulation and cognitive health." },
        { id: "ins_toast_2", type: "info", title: "Bioavailable Protein", description: "Eggs supply the golden standard of whole food protein with complete essential amino acid profiles." },
        { id: "ins_toast_3", type: "warning", title: "Moderate Sodium", description: "Seasoning and sourdough bring sodium to 520mg. Keep an eye on daily salt accumulates." }
      ],
      recommendations: [
        { id: "rec_toast_1", title: "Increase Protein Split", description: "To optimize muscle maintenance, consider adding 50g of sliced turkey breast or a side of egg whites.", tag: "Macros" },
        { id: "rec_toast_2", title: "Best Meal Timing: Morning", description: "Sustained fat-and-protein fuel is perfect as a morning kickoff to maintain stable insulin curves.", tag: "Timing" }
      ]
    }
  }
];

export const MealVisionService = {
  async analyzeMealImage(
    base64OrUrl: string,
    onProgress: (stage: string) => void
  ): Promise<MealScanResult> {
    const stages = [
      { name: "Establishing secure ingestion handshakes...", duration: 500 },
      { name: "Extracting RGB histogram matrices...", duration: 800 },
      { name: "Isolating food contour geometry...", duration: 900 },
      { name: "Decomposing volumetric macro-density...", duration: 700 },
      { name: "Formulating sports science coaching targets...", duration: 600 }
    ];

    for (const stage of stages) {
      onProgress(stage.name);
      await new Promise(resolve => setTimeout(resolve, stage.duration));
    }

    if (typeof window !== 'undefined' && !navigator.onLine) {
      throw { type: 'offline', message: "Your device is currently offline. Please check your internet connection." };
    }

    let resultPayload: MealScanResult;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/meal/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({ image: base64OrUrl })
      });

      if (!response.ok) {
        let errMsg = 'Failed to analyze food via AI server.';
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errMsg = errData.error;
          }
        } catch (_) {}
        throw new Error(errMsg);
      }

      const parsed = await response.json();
      resultPayload = {
        ...parsed,
        id: "scan_" + Date.now(),
        imageUrl: base64OrUrl,
        scanDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

    } catch (err: any) {
      console.error("AI backend analyzer unavailable:", err);
      throw { type: 'api_error', message: err.message || "Unable to reach the virtual analysis network. Please retry." };
    }

    // Save to history automatically (asynchronous fire-and-forget style)
    this.saveToHistory(resultPayload);

    return resultPayload;
  },

  async getHistory(userId?: string): Promise<MealScanResult[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = userId || session?.user?.id;
      if (uid) {
        const { data, error } = await supabase
          .from('meals')
          .select('*')
          .eq('user_id', uid)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((m: any) => ({
            id: String(m.id),
            mealName: m.meal_name,
            calories: Number(m.calories),
            protein: Number(m.protein),
            carbs: Number(m.carbs),
            fat: Number(m.fat),
            fiber: Number(m.fiber),
            sugar: Number(m.sugar),
            sodium: Number(m.sodium),
            servingSize: m.serving_size,
            confidenceScore: Number(m.confidence_score),
            healthScore: Number(m.health_score),
            imageUrl: m.image_url,
            scanDate: m.scan_date,
            detectedFoods: m.detected_foods || [],
            insights: m.insights || [],
            recommendations: m.recommendations || []
          }));
        }
      }
    } catch (err) {
      console.warn("Could not query meals from Supabase, loading from local history:", err);
    }

    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    try {
      return JSON.parse(saved) as MealScanResult[];
    } catch {
      return [];
    }
  },

  async saveToHistory(result: MealScanResult, userId?: string): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = userId || session?.user?.id;
      if (uid) {
        const payload = {
          user_id: uid,
          meal_name: result.mealName,
          calories: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fat: result.fat,
          fiber: result.fiber,
          sugar: result.sugar,
          sodium: result.sodium,
          serving_size: result.servingSize,
          confidence_score: result.confidenceScore,
          health_score: result.healthScore,
          image_url: result.imageUrl,
          scan_date: result.scanDate,
          detected_foods: result.detectedFoods,
          insights: result.insights,
          recommendations: result.recommendations,
          created_at: new Date().toISOString()
        };

        await supabase.from('meals').insert([payload]);
      }
    } catch (err) {
      console.warn("Failed to write meal scan to Supabase:", err);
    }

    if (typeof window === 'undefined') return;
    const history = await this.getHistory();
    const exists = history.some(h => h.imageUrl === result.imageUrl && h.mealName === result.mealName);
    if (!exists) {
      const updated = [result, ...history];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  },

  async deleteFromHistory(id: string, userId?: string): Promise<MealScanResult[]> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const uid = userId || session?.user?.id;
      if (uid) {
        // Try to delete both with the text id or uuid depending on the table
        await supabase.from('meals').delete().eq('id', id).eq('user_id', uid);
      }
    } catch (err) {
      console.warn("Could not delete meal row from Supabase:", err);
    }

    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    try {
      const history = JSON.parse(saved) as MealScanResult[];
      const updated = history.filter(h => h.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  },

  downloadJsonReport(result: MealScanResult) {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(result, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `aura_meal_report_${result.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  exportToPdf(result: MealScanResult) {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const insightsHtml = result.insights.map(i => `
      <div style="margin-bottom: 8px; padding: 10px; border-radius: 6px; background-color: #f8fafc; border-left: 4px solid ${i.type === 'error' ? '#ef4444' : i.type === 'warning' ? '#f59e0b' : '#10b981'}">
        <h4 style="margin: 0; font-size: 13px; color: #1e293b;">${i.title}</h4>
        <p style="margin: 3px 0 0 0; font-size: 11px; color: #475569;">${i.description}</p>
      </div>
    `).join('');

    const recommendationsHtml = result.recommendations.map(r => `
      <div style="margin-bottom: 8px; padding: 10px; border-radius: 6px; background-color: #f0fdf4; border: 1px solid #bbf7d0;">
        <span style="font-size: 9px; font-weight: bold; text-transform: uppercase; color: #166534; background-color: #dcfce7; padding: 2px 6px; border-radius: 4px;">${r.tag}</span>
        <h4 style="margin: 4px 0 0 0; font-size: 12px; color: #14532d;">${r.title}</h4>
        <p style="margin: 3px 0 0 0; font-size: 11px; color: #166534;">${r.description}</p>
      </div>
    `).join('');

    const detectedFoodsHtml = result.detectedFoods.map(f => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px;">${f.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: right;">${f.calories} kcal</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: right;">${f.protein}g</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: right;">${f.carbs}g</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: right;">${f.fat}g</td>
        <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; text-align: right; color: #64748b;">${f.confidence}%</td>
      </tr>
    `).join('');

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Aura Nutrition Report - ${result.mealName}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.5; padding: 30px; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 25px; }
            .title { font-size: 24px; font-weight: bold; margin: 0; color: #0f172a; }
            .subtitle { font-size: 12px; color: #64748b; margin-top: 5px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
            .card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; }
            .macro-badge { text-align: center; padding: 10px; background-color: #f8fafc; border-radius: 6px; }
            .macro-value { font-size: 18px; font-weight: bold; color: #0f172a; }
            .macro-label { font-size: 10px; text-transform: uppercase; color: #64748b; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background-color: #f1f5f9; padding: 8px; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">AURA AI MEAL VISION REPORT</h1>
            <div class="subtitle">Scanned on: ${result.scanDate} | Scan Confidence: ${result.confidenceScore}%</div>
          </div>
          
          <div class="grid">
            <div class="card">
              <h3 style="margin-top: 0; font-size: 15px; color: #0f172a;">${result.mealName}</h3>
              <div style="font-size: 13px; margin-bottom: 10px;">Serving Size: <strong>${result.servingSize}</strong></div>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
                <div class="macro-badge">
                  <div class="macro-value" style="color: #4f46e5;">${result.calories}</div>
                  <div class="macro-label">Calories</div>
                </div>
                <div class="macro-badge">
                  <div class="macro-value">${result.protein}g</div>
                  <div class="macro-label">Protein</div>
                </div>
                <div class="macro-badge">
                  <div class="macro-value">${result.carbs}g</div>
                  <div class="macro-label">Carbs</div>
                </div>
                <div class="macro-badge">
                  <div class="macro-value">${result.fat}g</div>
                  <div class="macro-label">Fat</div>
                </div>
              </div>
              <div style="margin-top: 15px; font-size: 11px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                <div>Fiber: <strong>${result.fiber}g</strong></div>
                <div>Sugar: <strong>${result.sugar}g</strong></div>
                <div>Sodium: <strong>${result.sodium}mg</strong></div>
              </div>
              <div style="margin-top: 15px; font-size: 14px; font-weight: bold;">
                Health Score: <span style="color: ${result.healthScore >= 80 ? '#10b981' : result.healthScore >= 60 ? '#f59e0b' : '#ef4444'}">${result.healthScore}/100</span>
              </div>
            </div>
            
            <div class="card">
              <h3 style="margin-top: 0; font-size: 15px; color: #0f172a;">AI Nutri-Analysis & Insights</h3>
              ${insightsHtml}
            </div>
          </div>
          
          <div class="card" style="margin-bottom: 25px;">
            <h3 style="margin-top: 0; font-size: 15px; color: #0f172a;">Multiple Detected Food Components</h3>
            <table>
              <thead>
                <tr>
                  <th style="text-align: left;">Food Item</th>
                  <th style="text-align: right;">Est. Calories</th>
                  <th style="text-align: right;">Protein</th>
                  <th style="text-align: right;">Carbs</th>
                  <th style="text-align: right;">Fat</th>
                  <th style="text-align: right;">Confidence</th>
                </tr>
              </thead>
              <tbody>
                ${detectedFoodsHtml}
              </tbody>
            </table>
          </div>

          <div class="card">
            <h3 style="margin-top: 0; font-size: 15px; color: #0f172a;">Coach Recommendations</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              ${recommendationsHtml}
            </div>
          </div>

          <div style="margin-top: 30px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 15px;">
            Generated by Aura Intelligent Athletic OS. Consult a clinical nutritionist before setting major thermodynamic targets.
          </div>
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();

    setTimeout(() => {
      iframe.remove();
    }, 1000);
  }
};
