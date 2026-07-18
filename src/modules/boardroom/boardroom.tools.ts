import { ToolDecorator as Tool, ExecutionContext, z } from '@nitrostack/core';
import dotenv from 'dotenv';

// Claude Desktop spawns the server as a background process and often misses the local .env file.
// We explicitly load it here using the absolute path to guarantee it finds the API key.
dotenv.config({ path: 'c:\\Users\\agraj\\OneDrive\\Desktop\\Nitrostack\\command-center\\.env' });

const COMPANY_CONTEXT = {
  financials: {
    cash_reserves: "$4,200,000",
    monthly_burn_rate: "$350,000",
    runway_months: 12,
    current_mrr: "$150,000",
  },
  technical: {
    stack: "Node.js, Postgres, AWS",
    tech_debt_level: "High - legacy monolithic services still active",
    open_p1_bugs: 12,
    engineering_headcount: 14
  },
  market: {
    brand_awareness: "Moderate",
    primary_competitor: "MegaCorp Inc.",
    market_share: "4%",
    current_quarter_growth: "5%"
  }
};

// Helper function to call Groq API
async function callGroqAgent(systemPrompt: string, userPrompt: string, ctx: ExecutionContext) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set in the environment.");
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      })
    });

    const data: any = await response.json();
    
    if (data.error) {
      throw new Error(`Groq API Error: ${data.error.message}`);
    }

    return JSON.parse(data.choices[0].message.content);
  } catch (error: any) {
    ctx.logger.error("Failed to call Groq API", { error: error.message });
    throw error;
  }
}

export class BoardroomTools {
  @Tool({
    name: 'analyze_financial_impact',
    description: 'CFO Agent: Analyze the financial impact of a strategic decision.',
    inputSchema: z.object({
      decision: z.string().describe('The proposed strategic decision'),
    })
  })
  async analyzeFinancialImpact(input: any, ctx: ExecutionContext) {
    ctx.logger.info('Analyzing financial impact via Groq CFO Agent', { decision: input.decision });
    
    const systemPrompt = `You are the Chief Financial Officer (CFO). Analyze the proposed strategic decision from a strictly financial perspective (ROI, burn rate, runway, cost, revenue).
    
CRITICAL INSTRUCTION: You MUST base your analysis STRICTLY on the following company financial data. Do not invent financial numbers.
Company Financials:
${JSON.stringify(COMPANY_CONTEXT.financials, null, 2)}

You MUST respond with a JSON object containing EXACTLY these keys:
- "analysis" (string: detailed financial breakdown using our real numbers)
- "confidence" (number between 0.0 and 1.0)
- "risks" (array of strings: financial risks)
- "recommendation" (string: your final verdict)`;

    const result = await callGroqAgent(systemPrompt, `Evaluate this decision: ${input.decision}`, ctx);

    return {
      perspective: 'CFO',
      decision: input.decision,
      analysis: result.analysis,
      confidence: result.confidence,
      risks: result.risks,
      recommendation: result.recommendation
    };
  }

  @Tool({
    name: 'evaluate_market_trends',
    description: 'CMO Agent: Evaluate market trends and competitive landscape for a decision.',
    inputSchema: z.object({
      decision: z.string().describe('The proposed strategic decision'),
    })
  })
  async evaluateMarketTrends(input: any, ctx: ExecutionContext) {
    ctx.logger.info('Evaluating market trends via Groq CMO Agent', { decision: input.decision });
    
    const systemPrompt = `You are the Chief Marketing Officer (CMO). Analyze the proposed strategic decision based on market trends, competitive landscape, branding, and customer acquisition.

CRITICAL INSTRUCTION: You MUST base your analysis STRICTLY on the following company market data. Do not invent metrics.
Company Market Data:
${JSON.stringify(COMPANY_CONTEXT.market, null, 2)}

You MUST respond with a JSON object containing EXACTLY these keys:
- "analysis" (string: detailed marketing breakdown using our real numbers)
- "confidence" (number between 0.0 and 1.0)
- "risks" (array of strings: marketing/brand risks)
- "recommendation" (string: your final verdict)`;

    const result = await callGroqAgent(systemPrompt, `Evaluate this decision: ${input.decision}`, ctx);

    return {
      perspective: 'CMO',
      decision: input.decision,
      analysis: result.analysis,
      confidence: result.confidence,
      risks: result.risks,
      recommendation: result.recommendation
    };
  }

  @Tool({
    name: 'assess_technical_feasibility',
    description: 'CTO Agent: Assess the technical feasibility and engineering effort for a decision.',
    inputSchema: z.object({
      decision: z.string().describe('The proposed strategic decision'),
    })
  })
  async assessTechnicalFeasibility(input: any, ctx: ExecutionContext) {
    ctx.logger.info('Assessing technical feasibility via Groq CTO Agent', { decision: input.decision });
    
    const systemPrompt = `You are the Chief Technology Officer (CTO). Analyze the proposed strategic decision based on technical feasibility, engineering effort, architecture, and tech debt.

CRITICAL INSTRUCTION: You MUST base your analysis STRICTLY on the following company technical data. Do not invent infrastructure metrics.
Company Technical Data:
${JSON.stringify(COMPANY_CONTEXT.technical, null, 2)}

You MUST respond with a JSON object containing EXACTLY these keys:
- "analysis" (string: detailed technical breakdown using our real tech stack and headcount)
- "confidence" (number between 0.0 and 1.0)
- "risks" (array of strings: technical/engineering risks)
- "recommendation" (string: your final verdict)`;

    const result = await callGroqAgent(systemPrompt, `Evaluate this decision: ${input.decision}`, ctx);

    return {
      perspective: 'CTO',
      decision: input.decision,
      analysis: result.analysis,
      confidence: result.confidence,
      risks: result.risks,
      recommendation: result.recommendation
    };
  }
}
