import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { OpenRouter } from '@openrouter/sdk';
import { InspectPollBiasResponse } from './interfaces/bias-inspector.interface';

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);
  private client!: OpenRouter;

  onModuleInit() {
    this.client = new OpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY || '',
    });
  }

  async generateText(prompt: string): Promise<string | any[] | undefined | null> {
    try {
      const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
      const response = await this.client.chat.send({
        chatRequest: {
          model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
      });
      if (response instanceof ReadableStream) {
        throw new Error('Expected a non-streaming response');
      }
      return response.choices[0].message.content;
    } catch (error) {
      this.logger.error('Failed to generate text', error);
      throw new Error('Failed to generate text');
    }
  }

  async inspectPollBias(
    title: string,
    options: string[],
  ): Promise<InspectPollBiasResponse> {
    const systemPrompt = `Você é um especialista em metodologia de pesquisas de opinião pública, ciência comportamental e elaboração de questionários.
Sua missão é inspecionar o rascunho de uma enquete (pergunta e opções) quanto a neutralidade, viés cognitivo e completude metodológica.

Avalie rigorosamente os seguintes critérios:
1. Perguntas indutivas (leading questions): Verifique se o título sugere uma resposta desejada, usa adjetivos tendenciosos ou faz pressuposições (ex.: "Você não acha que TypeScript é o melhor?"). Se detectar indução, sugira uma formulação imparcial em "suggestedTitle".
2. Alternativas ausentes (missing alternatives): Verifique se faltam opções relevantes ou opções concorrentes óbvias que poderiam distorcer os resultados.
3. Válvulas de escape ausentes (missing escape hatches): Verifique se há uma opção como "Nenhum dos anteriores", "Outro" ou "Não sei / Ver resultados", caso as opções não sejam mutuamente exclusivas e totalmente exaustivas.
4. Equilíbrio e simetria: O tom das opções deve ser uniforme e não pender para o positivo ou negativo.

IMPORTANTE: Responda estritamente em formato JSON válido com este esquema:
{
  "isNeutral": boolean,
  "score": number, // número inteiro de 0 a 100 indicando o grau de neutralidade e qualidade
  "summary": string, // resumo sucinto em português da avaliação da enquete
  "issues": [
    {
      "type": "leading_question" | "missing_alternatives" | "missing_escape_hatch" | "other",
      "severity": "critical" | "warning" | "info",
      "title": string, // título curto do problema
      "description": string, // detalhe do problema
      "suggestion": string // como corrigir
    }
  ],
  "suggestedTitle": string | null, // se a pergunta for indutiva ou tiver viés, forneça o título reescrito de forma neutra; senão null
  "suggestedOptionsToAdd": string[] // lista de 1 a 3 opções recomendadas para adicionar (alternativas que faltam ou válvula de escape)
}
Retorne apenas o JSON puro, sem blocos markdown.`;

    const userContent = JSON.stringify({
      title: title.trim(),
      options: options.map((opt) => opt.trim()).filter((opt) => opt.length > 0),
    });

    try {
      const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
      const response = await this.client.chat.send({
        chatRequest: {
          model,
          responseFormat: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Analise a enquete:\n${userContent}` },
          ],
        },
      });

      if (response instanceof ReadableStream) {
        throw new Error('Expected non-streaming response from OpenRouter');
      }

      const rawContent = response.choices?.[0]?.message?.content;
      if (!rawContent || typeof rawContent !== 'string') {
        throw new Error('Empty response from AI model');
      }

      const cleanJson = rawContent
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();

      const parsed = JSON.parse(cleanJson) as InspectPollBiasResponse;

      return {
        isNeutral: typeof parsed.isNeutral === 'boolean' ? parsed.isNeutral : true,
        score: typeof parsed.score === 'number' ? Math.max(0, Math.min(100, Math.round(parsed.score))) : 100,
        summary: parsed.summary || 'Análise de neutralidade concluída com sucesso.',
        issues: Array.isArray(parsed.issues) ? parsed.issues : [],
        suggestedTitle: parsed.suggestedTitle || null,
        suggestedOptionsToAdd: Array.isArray(parsed.suggestedOptionsToAdd)
          ? parsed.suggestedOptionsToAdd
          : [],
      };
    } catch (error) {
      this.logger.error('Error during poll bias inspection', error);
      throw new Error('Falha ao inspecionar a neutralidade da enquete');
    }
  }
}