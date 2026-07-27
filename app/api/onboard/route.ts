import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60; // Max out Next.js API execution timeout on Vercel to 60s for PDF parsing

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pdfBase64, apiKey } = body;

    if (!pdfBase64) {
      return NextResponse.json({ error: 'Missing pdfBase64 data in request body.' }, { status: 400 });
    }

    // Determine which API key to use (request-specified, or server environment)
    const activeApiKey = apiKey || process.env.GEMINI_API_KEY;

    if (!activeApiKey) {
      return NextResponse.json({
        error: 'No Gemini API key available. Please provide an API key in the UI settings or configure GEMINI_API_KEY on the server.'
      }, { status: 400 });
    }

    // Initialize Gemini API
    const ai = new GoogleGenerativeAI(activeApiKey);

    const prompt = `
      You are an expert assistant for Warhammer: Age of Sigmar (Spearhead).
      Your task is to analyze the uploaded Spearhead Faction Rules sheet PDF and extract ALL faction rules, traits, regiment abilities, enhancements, units, and weapons.
      
      CRITICAL: A single faction PDF document can sometimes contain rules for multiple different Spearhead armies/detachments for the same overall Faction.
      For example, the Stormcast Eternals faction pack contains BOTH the "Vigilant Brotherhood" army and the "Lightning Echelon" army in the same file.
      If you find multiple armies/detachments in the document, you MUST extract EACH of them as a separate Faction object.
      
      For each army, extract:
      1. Faction Name (e.g., OGOR MAWTRIBES or STORMCAST ETERNALS) and Spearhead Army Name (e.g., WARGLUTT MARAUDERS or VIGILANT BROTHERHOOD)
      2. Battle Traits, Regiment Abilities, and Enhancements.
         - For each, identify when it is used (which Phase, and who/when it targets: "timing").
         - Set 'phase' to one of: 'start' | 'hero' | 'movement' | 'shooting' | 'charge' | 'combat' | 'end' | 'passive'.
         - Set 'once' to one of: 'once-per-turn' | 'once-per-battle' | 'none'.
      3. Units list:
         - Identify the standard squad sizes / model count for each unit on the first page summary list (e.g., "5 Witch Aelves" has 5 models, "Melusai Ironscale" has 1 model). Set 'models' to this number.
         - If a unit is listed multiple times on the summary page roster list (for example, "5 Witch Aelves" is listed twice), you MUST create multiple separate unit entries for them in the 'units' array, assigning each a unique ID (e.g. "witchAelves1", "witchAelves2") so they are treated as separate, distinct unit entities.
         - Extract all stats: Move (number, inside the move circle), Control (number), Health (number), Save (number, e.g., if "4+" then write 4), Ward (number, e.g., if "6+" then write 6, write 0 if there is no ward).
         - Determine if the unit is a HERO (isHero: true).
         - Extract ALL Weapons (both Melee and Ranged), with details: range (e.g. "Melee" or "12\""), attacks (e.g. "3" or "D6"), hit (number e.g. 3 for 3+), wound (number e.g. 4 for 4+), rend (number e.g. 1 for -1, or 0 if none), damage (e.g. "2" or "D3"), and any weapon abilities (e.g., "Crit (Mortal)").
         - Extract ALL Unit Abilities. Set their timing, phase, and 'once' use limits accurately.

      You MUST respond with a single, perfectly structured JSON object matching this schema. The "factions" property should contain an array of all extracted armies:
      {
        "factions": [
          {
            "id": "string (lowercase kebab-case id of faction, e.g. ogor-mawtribes-warglutt-marauders)",
            "name": "string (Faction Name, e.g. Ogor Mawtribes)",
            "spearheadName": "string (Army Name, e.g. Warglutt Marauders)",
            "battleTraits": [
              {
                "id": "string (unique camelCase id)",
                "name": "string (Ability name)",
                "effect": "string (full effect text)",
                "phase": "start | hero | movement | shooting | charge | combat | end | passive",
                "timing": "string (e.g. 'Your Hero Phase' or 'Enemy Combat Phase')",
                "once": "once-per-turn | once-per-battle | none"
              }
            ],
            "regimentAbilities": [
              {
                "id": "string (unique camelCase id)",
                "name": "string",
                "effect": "string",
                "phase": "start | hero | movement | shooting | charge | combat | end | passive",
                "timing": "string",
                "once": "once-per-turn | once-per-battle | none"
              }
            ],
            "enhancements": [
              {
                "id": "string (unique camelCase id)",
                "name": "string",
                "effect": "string",
                "phase": "start | hero | movement | shooting | charge | combat | end | passive",
                "timing": "string",
                "once": "once-per-turn | once-per-battle | none"
              }
            ],
            "units": [
              {
                "id": "string (unique camelCase id)",
                "name": "string (Unit name)",
                "move": "number",
                "control": "number",
                "health": "number",
                "models": "number (starting model count / squad size extracted from first page summary list, e.g. 5 or 1)",
                "save": "number (save number only e.g. 4)",
                "ward": "number (ward number only e.g. 6, or 0)",
                "isHero": "boolean",
                "weapons": [
                  {
                    "name": "string",
                    "range": "string",
                    "attacks": "string",
                    "hit": "number",
                    "wound": "number",
                    "rend": "number",
                    "damage": "string",
                    "abilities": "string (optional)"
                  }
                ],
                "abilities": [
                  {
                    "id": "string (unique camelCase id)",
                    "name": "string",
                    "effect": "string",
                    "phase": "start | hero | movement | shooting | charge | combat | end | passive",
                    "timing": "string",
                    "once": "once-per-turn | once-per-battle | none"
                  }
                ]
              }
            ]
          }
        ]
      }
    `;

    // Define self-healing model and endpoint fallback configurations
    const configsToTry = [
      { modelName: 'gemini-2.5-flash', apiVersion: 'v1' },
      { modelName: 'gemini-2.0-flash', apiVersion: 'v1' },
      { modelName: 'gemini-flash-latest', apiVersion: 'v1' },
      { modelName: 'gemini-1.5-flash', apiVersion: 'v1' },
      { modelName: 'gemini-2.5-flash', apiVersion: 'v1beta' },
      { modelName: 'gemini-2.0-flash', apiVersion: 'v1beta' },
      { modelName: 'gemini-flash-latest', apiVersion: 'v1beta' },
      { modelName: 'gemini-3.5-flash', apiVersion: 'v1' },
      { modelName: 'gemini-3.6-flash', apiVersion: 'v1' },
      { modelName: 'gemini-2.5-pro', apiVersion: 'v1' },
      { modelName: 'gemini-1.5-flash-latest', apiVersion: 'v1' },
      { modelName: 'gemini-1.5-flash', apiVersion: 'v1beta' },
      { modelName: 'gemini-1.5-flash-latest', apiVersion: 'v1beta' },
      { modelName: 'gemini-1.5-pro', apiVersion: 'v1' },
      { modelName: 'gemini-1.5-pro', apiVersion: 'v1beta' },
      { modelName: 'gemini-2.0-flash-exp', apiVersion: 'v1beta' },
      { modelName: 'gemini-1.5-flash-001', apiVersion: 'v1' },
    ];

    let response = null;
    let lastError: any = null;
    let successfulModel = '';
    let successfulVersion = '';

    for (const config of configsToTry) {
      try {
        console.log(`[Onboarding API] Attempting scan with model: "${config.modelName}" on endpoint version: "${config.apiVersion}"`);
        const model = ai.getGenerativeModel({ model: config.modelName }, { apiVersion: config.apiVersion });
        
        response = await model.generateContent([
          {
            inlineData: {
              data: pdfBase64,
              mimeType: 'application/pdf'
            }
          },
          prompt
        ]);

        successfulModel = config.modelName;
        successfulVersion = config.apiVersion;
        console.log(`[Onboarding API] SCAN SUCCESSFUL! Used model: "${successfulModel}" via endpoint version: "${successfulVersion}"`);
        break; // Success! Break out of the loop
      } catch (err: any) {
        console.warn(`[Onboarding API] Model "${config.modelName}" (${config.apiVersion}) failed: ${err.message}`);
        lastError = err;
        
        // If it's a 404 (model not found) or support issue, try the next model configuration
        const errMsg = (err.message || '').toLowerCase();
        if (
          errMsg.includes('404') || 
          errMsg.includes('429') ||
          errMsg.includes('quota') ||
          errMsg.includes('limit') ||
          errMsg.includes('not found') || 
          errMsg.includes('not supported') || 
          errMsg.includes('support')
        ) {
          continue;
        } else {
          // If it's a structural API Key / permission error (400, 403), stop immediately to avoid wasting API calls
          break;
        }
      }
    }

    if (!response) {
      // Diagnostic check: Query available models for this key to provide high-fidelity developer guidance
      let diagnosticMessage = '';
      try {
        const diagUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${activeApiKey}`;
        const diagRes = await fetch(diagUrl);
        if (diagRes.status === 404) {
          diagnosticMessage = '\n\n🔍 DIAGNOSTICS: Google returned a 404 for your project. This indicates that your API key is valid, but the "Generative Language API" is NOT enabled in your Google Cloud Project console. Please enable the Generative Language API, or create a free API key instantly in Google AI Studio (https://aistudio.google.com/).';
        } else if (diagRes.status === 400 || diagRes.status === 403) {
          diagnosticMessage = '\n\n🔍 DIAGNOSTICS: Google rejected your API key as invalid. Please check for typos, copy/paste errors, or generate a fresh key in Google AI Studio (https://aistudio.google.com/).';
        } else if (diagRes.ok) {
          const diagData = await diagRes.json();
          const availableModelNames = (diagData.models || []).map((m: any) => m.name.replace('models/', ''));
          diagnosticMessage = `\n\n🔍 DIAGNOSTICS: Your API key is authorized but none of the standard models were responsive. The models available to your key are: ${availableModelNames.join(', ') || 'none'}.`;
        }
      } catch (diagErr) {
        // Suppress diagnostic errors to avoid masking the primary error
      }

      throw new Error((lastError?.message || 'All model configurations failed.') + diagnosticMessage);
    }

    const responseText = response.response.text();

    // Extract JSON block if enclosed in ```json ... ```
    let jsonString = responseText.trim();
    if (jsonString.startsWith('```')) {
      const match = jsonString.match(/```(?:json)?([\s\S]+?)```/);
      if (match) {
        jsonString = match[1].trim();
      }
    }

    const parsedData = JSON.parse(jsonString);
    let factionsArray = [];
    if (Array.isArray(parsedData)) {
      factionsArray = parsedData;
    } else if (parsedData && Array.isArray(parsedData.factions)) {
      factionsArray = parsedData.factions;
    } else if (parsedData) {
      factionsArray = [parsedData];
    }

    return NextResponse.json({ success: true, factions: factionsArray });
  } catch (error: any) {
    console.error('Error parsing faction sheet PDF via Gemini API:', error);
    return NextResponse.json({
      error: 'Failed to scan the faction PDF. Make sure it is a valid Spearhead PDF. Details: ' + error.message
    }, { status: 500 });
  }
}
