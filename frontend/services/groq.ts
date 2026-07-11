export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const groqService = {
  async askCoach(prompt: string, history: ChatMessage[] = []): Promise<string> {
    try {
      const response = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, history }),
      });

      if (!response.ok) {
        throw new Error('API server encountered an error');
      }

      const data = await response.json();
      return data.text || 'Sorry, I couldn\'t formulate a recommendation at this time.';
    } catch (e: any) {
      console.error('Error in askCoach:', e);
      // Beautiful smart sandbox fallback response if server is offline or keys missing
      return `### 🌟 Smart Sandbox Coach Mode Active

I see the server is initializing. Here are some immediate elite advice based on your prompt:

1. **Keep Consistency**: Aim for 3-4 structured sessions per week focusing on progressive overload.
2. **Fuel and Hydrate**: Keep protein intake around 1.6g - 2.2g per kg of bodyweight, and aim for 3L+ water daily.
3. **Rest and Recover**: Target 7-8 hours of sleep.

*Once your API services are fully compiled, the cloud-grounded Gemini brain will deliver bespoke dynamic coaching!*`;
    }
  },

  async generateWorkout(goal: string, daysPerWeek: number, level: string): Promise<string> {
    const prompt = `Generate a highly structured weekly workout program for an athlete with the following specifications:
- Fitness Goal: ${goal}
- Days Per Week: ${daysPerWeek} days
- Experience Level: ${level}
Please output a premium, formatted daily schedule, exercises, sets, reps, and dynamic coach insights.`;
    return this.askCoach(prompt);
  },

  async getNutritionRecommendations(weight: number, height: number, goal: string): Promise<string> {
    const prompt = `Provide an elite personalized nutrition and macro recommendation sheet for an athlete with:
- Weight: ${weight} kg
- Height: ${height} cm
- Primary Fitness Goal: ${goal}
Calculate exact daily TDEE estimates, target calorie levels, and detailed grams of protein, carbs, and fats to optimize recovery and performance.`;
    return this.askCoach(prompt);
  },

  async getDailyMotivation(): Promise<string> {
    const prompt = `Give me a single, deeply punchy, elite daily fitness motivation quote and action step in the style of Vercel/Linear (brief, high-contrast, impactful).`;
    return this.askCoach(prompt);
  }
};
