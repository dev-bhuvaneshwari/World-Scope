import crypto from 'crypto';
import config from '../config/env.js';
import Summary from '../models/Summary.js';
import cacheService from './cacheService.js';

const SYSTEM_PROMPT = `You are a factual information summarization system for WorldScope, a global intelligence platform.

STRICT RULES:
1. Use ONLY the supplied source material below.
2. Do NOT introduce facts, dates, statistics, organizations, people, events, or claims not present in the source material.
3. Do NOT fabricate or invent any information.
4. If the source material is insufficient, explicitly state: "Insufficient data available for a comprehensive summary."
5. Separate directly reported facts from reasonable synthesis.
6. Keep summaries concise, professional, and understandable.
7. Preserve original dates and attribution.
8. Use uncertainty markers ("reportedly", "according to sources") when appropriate.
9. Format your response as structured JSON.`;

// In-flight request deduplication map to prevent concurrent stampedes
const pendingRequests = new Map();

const aiService = {
  /**
   * Get all configured AI providers in cascade priority order
   */
  async getAIProviders() {
    const { default: OpenAI } = await import('openai');
    const providers = [];

    if (config.geminiApiKey) {
      providers.push({
        client: new OpenAI({
          apiKey: config.geminiApiKey,
          baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
        }),
        model: 'gemini-1.5-flash',
        modelName: 'gemini-1.5-flash (Google Gemini Free)',
      });
    }

    if (config.groqApiKey) {
      providers.push({
        client: new OpenAI({
          apiKey: config.groqApiKey,
          baseURL: 'https://api.groq.com/openai/v1',
        }),
        model: 'openai/gpt-oss-120b',
        modelName: 'Groq Cloud (Free)',
      });
    }

    if (config.openaiApiKey) {
      providers.push({
        client: new OpenAI({ apiKey: config.openaiApiKey }),
        model: 'gpt-4o-mini',
        modelName: 'gpt-4o-mini (OpenAI)',
      });
    }

    return providers;
  },

  /**
   * Generate AI summary for a country with caching, in-flight deduplication, and failover cascade
   */
  async generateCountrySummary(countryCode, countryName, sourceData) {
    const contentHash = this.hashContent(JSON.stringify(sourceData));
    const inflightKey = `${countryCode}:country:${contentHash}`;
    
    // 1. Check cache (2ms instant response)
    const cachedSummary = await this.getCachedSummary(countryCode, 'country', contentHash);
    if (cachedSummary) return cachedSummary;

    // 2. In-flight request deduplication for concurrent users
    if (pendingRequests.has(inflightKey)) {
      return pendingRequests.get(inflightKey);
    }

    const task = (async () => {
      const providers = await this.getAIProviders();
      if (providers.length === 0) {
        return this.generateFallbackSummary(countryName, sourceData);
      }

      const userPrompt = `Summarize the following information about ${countryName}. 
Return a JSON object with these fields:
- overview: A 2-3 sentence factual overview
- keyDevelopments: Array of 3-5 key developments (strings)
- trends: Array of 2-4 notable trends (strings)
- implications: Array of 1-3 possible implications (strings)

SOURCE DATA:
${JSON.stringify(sourceData, null, 2).substring(0, 8000)}`;

      // Try each provider in cascade
      for (const provider of providers) {
        try {
          const completion = await provider.client.chat.completions.create({
            model: provider.model,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
            response_format: { type: 'json_object' },
            max_tokens: 1500,
            temperature: 0.3,
          });

          const content = completion.choices[0]?.message?.content;
          let parsed;
          try {
            parsed = JSON.parse(content);
          } catch {
            parsed = { overview: content, keyDevelopments: [], trends: [], implications: [] };
          }

          const summaryDoc = {
            countryCode: countryCode.toUpperCase(),
            type: 'country',
            contentHash,
            summary: parsed.overview || '',
            keyDevelopments: parsed.keyDevelopments || [],
            trends: parsed.trends || [],
            implications: parsed.implications || [],
            generatedAt: new Date(),
            expiresAt: new Date(Date.now() + config.cache.summaryTTL),
            model: provider.modelName,
            isDemo: false,
          };

          await this.saveSummary(summaryDoc);
          return summaryDoc;
        } catch (error) {
          console.warn(`[AI Failover] ${provider.modelName} error: ${error.message}. Cascading...`);
        }
      }

      return this.generateFallbackSummary(countryName, sourceData);
    })();

    pendingRequests.set(inflightKey, task);
    try {
      return await task;
    } finally {
      pendingRequests.delete(inflightKey);
    }
  },

  /**
   * Generate summary for specific content type with deduplication and failover
   */
  async generateTopicSummary(countryCode, countryName, type, sourceData) {
    const contentHash = this.hashContent(JSON.stringify(sourceData));
    const inflightKey = `${countryCode}:${type}:${contentHash}`;
    
    const cachedSummary = await this.getCachedSummary(countryCode, type, contentHash);
    if (cachedSummary) return cachedSummary;

    if (pendingRequests.has(inflightKey)) {
      return pendingRequests.get(inflightKey);
    }

    const task = (async () => {
      const providers = await this.getAIProviders();
      if (providers.length === 0) {
        return this.generateFallbackSummary(countryName, sourceData, type);
      }

      const typeLabels = {
        news: 'latest news', technology: 'technology trends',
        industry: 'emerging industries', startup: 'startup activity',
        research: 'research developments',
      };

      const prompt = `Summarize the ${typeLabels[type] || type} for ${countryName}. 
Return a JSON object with: overview (string), keyDevelopments (string array), trends (string array).

SOURCE DATA:
${JSON.stringify(sourceData, null, 2).substring(0, 6000)}`;

      for (const provider of providers) {
        try {
          const completion = await provider.client.chat.completions.create({
            model: provider.model,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: prompt },
            ],
            response_format: { type: 'json_object' },
            max_tokens: 1000,
            temperature: 0.3,
          });

          const content = completion.choices[0]?.message?.content;
          let parsed;
          try {
            parsed = JSON.parse(content);
          } catch {
            parsed = { overview: content, keyDevelopments: [], trends: [] };
          }

          const summaryDoc = {
            countryCode: countryCode.toUpperCase(),
            type,
            contentHash,
            summary: parsed.overview || '',
            keyDevelopments: parsed.keyDevelopments || [],
            trends: parsed.trends || [],
            implications: parsed.implications || [],
            generatedAt: new Date(),
            expiresAt: new Date(Date.now() + config.cache.summaryTTL),
            model: provider.modelName,
            isDemo: false,
          };

          await this.saveSummary(summaryDoc);
          return summaryDoc;
        } catch (error) {
          console.warn(`[AI Failover] ${provider.modelName} error: ${error.message}. Cascading...`);
        }
      }

      return this.generateFallbackSummary(countryName, sourceData, type);
    })();

    pendingRequests.set(inflightKey, task);
    try {
      return await task;
    } finally {
      pendingRequests.delete(inflightKey);
    }
  },

  /**
   * Extractive fallback when OpenAI is unavailable
   */
  generateFallbackSummary(countryName, sourceData, type = 'country') {
    const items = [];
    
    if (sourceData.news) {
      items.push(...sourceData.news.slice(0, 5).map(n => n.title));
    }
    if (sourceData.trends || sourceData.technologies) {
      const techs = sourceData.trends || sourceData.technologies;
      items.push(...techs.slice(0, 3).map(t => t.description || t.name));
    }
    if (sourceData.papers || sourceData.research) {
      const papers = sourceData.papers || sourceData.research;
      items.push(...papers.slice(0, 3).map(p => p.title));
    }
    if (Array.isArray(sourceData)) {
      items.push(...sourceData.slice(0, 5).map(s => s.title || s.description || s.name || ''));
    }

    const developments = items.filter(Boolean).slice(0, 5);
    const overview = developments.length > 0
      ? `Based on available data, key ${type} developments for ${countryName} include recent activity in ${developments.slice(0, 2).join(' and ').substring(0, 200)}.`
      : `Insufficient data available for a comprehensive ${type} summary of ${countryName}. Connect additional data sources for more detailed insights.`;

    return {
      countryCode: '',
      type,
      contentHash: '',
      summary: overview,
      keyDevelopments: developments,
      trends: [],
      implications: [],
      generatedAt: new Date(),
      expiresAt: new Date(Date.now() + config.cache.summaryTTL),
      model: 'extractive-fallback',
      isDemo: !config.hasOpenAI(),
    };
  },

  /**
   * Check for cached summary
   */
  async getCachedSummary(countryCode, type, contentHash) {
    const cacheKey = `summary:${countryCode}:${type}:${contentHash}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const dbSummary = await Summary.findOne({
        countryCode: countryCode.toUpperCase(),
        type,
        expiresAt: { $gt: new Date() },
      }).sort({ generatedAt: -1 }).lean();

      if (dbSummary) {
        await cacheService.set(cacheKey, dbSummary, config.cache.summaryTTL);
        return dbSummary;
      }
    } catch { /* ignore */ }

    return null;
  },

  /**
   * Save summary to DB and cache
   */
  async saveSummary(summaryDoc) {
    try {
      await Summary.findOneAndUpdate(
        { countryCode: summaryDoc.countryCode, type: summaryDoc.type, contentHash: summaryDoc.contentHash },
        summaryDoc,
        { upsert: true, new: true }
      );
      const cacheKey = `summary:${summaryDoc.countryCode}:${summaryDoc.type}:${summaryDoc.contentHash}`;
      await cacheService.set(cacheKey, summaryDoc, config.cache.summaryTTL);
    } catch (e) {
      console.warn('Failed to save summary:', e.message);
    }
  },

  hashContent(content) {
    return crypto.createHash('md5').update(content).digest('hex').substring(0, 16);
  },
};

export default aiService;
