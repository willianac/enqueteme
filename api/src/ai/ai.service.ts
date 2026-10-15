import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { OpenRouter } from '@openrouter/sdk';
import * as cheerio from 'cheerio';
import { InspectPollBiasResponse } from './interfaces/bias-inspector.interface';
import { GeneratePollResponse } from './interfaces/generate-poll.interface';
import {
  ExplainPollDebateResponse,
  PollOptionDebateAnalysis,
} from './interfaces/explain-poll.interface';
import { GeneratePollFromContentResponse } from './interfaces/generate-from-content.interface';

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);
  private client!: OpenRouter;
  private readonly explanationCache = new Map<number, ExplainPollDebateResponse>();

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
        score:
          typeof parsed.score === 'number'
            ? Math.max(0, Math.min(100, Math.round(parsed.score)))
            : 100,
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

  async generatePoll(
    prompt: string,
    currentOptions?: string[],
  ): Promise<GeneratePollResponse> {
    const systemPrompt = `Você é um especialista em metodologia de pesquisas de opinião pública, design de questionários e formulação de enquetes.
Sua missão é receber um tema, rascunho de pergunta ou ideia fornecido pelo usuário e gerar uma enquete estruturada, imparcial e de alta qualidade metodológica.

Diretrizes obrigatórias:
1. Título/Pergunta: Formule uma pergunta neutra, clara, concisa e envolvente (no mesmo idioma do prompt do usuário, prioritariamente em Português). Nunca use perguntas tendenciosas ou que induzam respostas.
2. Opções de resposta (princípio MECE - Mutuamente Exclusivas e Coletivamente Exaustivas):
   - Gere entre 2 e 5 opções balanceadas e pertinentes ao tema (o sistema suporta no máximo 5 opções).
   - Se o usuário já tiver fornecido opções existentes, leve-as em consideração, refinando-as ou sugerindo alternativas que completem o conjunto.
   - Quando fizer sentido, inclua uma opção como "Outro", "Nenhum dos anteriores" ou "Não sei / Ver resultados" para não forçar escolhas.
   - Garanta que a quantidade total de opções seja no mínimo 2 e no máximo 5.

IMPORTANTE: Responda estritamente em formato JSON válido com este esquema:
{
  "title": string,
  "options": string[] // lista contendo de 2 a 5 strings de opções
}
Retorne apenas o JSON puro, sem blocos markdown.`;

    const userPayload: Record<string, any> = {
      prompt: prompt.trim(),
    };
    if (currentOptions && currentOptions.length > 0) {
      userPayload.currentOptions = currentOptions
        .map((opt) => opt.trim())
        .filter((opt) => opt.length > 0);
    }

    try {
      const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
      const response = await this.client.chat.send({
        chatRequest: {
          model,
          responseFormat: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Gere a enquete com base nas informações:\n${JSON.stringify(userPayload)}`,
            },
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

      const parsed = JSON.parse(cleanJson) as GeneratePollResponse;

      const title =
        typeof parsed.title === 'string' && parsed.title.trim().length > 0
          ? parsed.title.trim()
          : prompt.trim();

      const options = Array.isArray(parsed.options)
        ? parsed.options
            .map((opt) => (typeof opt === 'string' ? opt.trim() : ''))
            .filter((opt) => opt.length > 0)
            .slice(0, 5)
        : [];

      if (options.length < 2) {
        throw new Error('O modelo não gerou o número mínimo de 2 opções');
      }

      return {
        title,
        options,
      };
    } catch (error) {
      this.logger.error('Error during poll generation', error);
      throw new Error('Falha ao gerar enquete com inteligência artificial');
    }
  }

  clearExplanationCache(): void {
    this.explanationCache.clear();
  }

  async explainPollDebate(
    pollId: number,
    title: string,
    options: string[],
  ): Promise<ExplainPollDebateResponse> {
    if (this.explanationCache.has(pollId)) {
      this.logger.log(`Serving cached explanation for pollId ${pollId}`);
      return this.explanationCache.get(pollId)!;
    }

    const systemPrompt = `Você é um analista neutro, educador e especialista em debates públicos, metodologia e tecnologia.
Sua missão é explicar para um participante de uma enquete o contexto do debate de forma 100% imparcial, apresentando prós e contras objetivos para cada opção disponível.

Diretrizes obrigatórias:
1. Imparcialidade estrita: NUNCA tome partido, nunca sugira qual opção é melhor ou recomendada, e nunca use juízo de valor opinativo. Mantenha um tom puramente descritivo, equilibrado e educativo.
2. Contexto geral (overview): Forneça uma explicação concisa de 1 a 2 frases claras contextualizando por que esse assunto é debatido ou qual é o dilema/trade-off central (em Português).
3. Análise das opções (options): Para CADA uma das opções fornecidas na enquete:
   - Forneça o nome original da opção.
   - Liste de 1 a 3 pontos fortes/argumentos a favor/vantagens (pros).
   - Liste de 1 a 3 pontos de atenção/contra-argumentos/riscos/desvantagens (cons).
   - Seja conciso e direto em cada ponto (frases curtas e informativas).

IMPORTANTE: Responda estritamente em formato JSON válido com este esquema:
{
  "overview": string,
  "options": [
    {
      "name": string,
      "pros": string[],
      "cons": string[]
    }
  ]
}
Retorne apenas o JSON puro, sem blocos markdown.`;

    const cleanOptions = options
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0);

    const userPayload = {
      title: title.trim(),
      options: cleanOptions,
    };

    try {
      const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
      const response = await this.client.chat.send({
        chatRequest: {
          model,
          responseFormat: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Analise e explique o debate da enquete:\n${JSON.stringify(userPayload)}`,
            },
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

      const parsed = JSON.parse(cleanJson) as {
        overview?: string;
        options?: Array<{ name?: string; pros?: string[]; cons?: string[] }>;
      };

      const overview =
        typeof parsed.overview === 'string' && parsed.overview.trim().length > 0
          ? parsed.overview.trim()
          : `Visão geral do debate sobre: "${title.trim()}".`;

      const formattedOptions: PollOptionDebateAnalysis[] = cleanOptions.map(
        (optName) => {
          const matching = Array.isArray(parsed.options)
            ? parsed.options.find(
                (o) =>
                  typeof o?.name === 'string' &&
                  o.name.trim().toLowerCase() === optName.toLowerCase(),
              )
            : undefined;

          const pros = Array.isArray(matching?.pros)
            ? matching.pros
                .filter(
                  (p): p is string => typeof p === 'string' && p.trim().length > 0,
                )
                .map((p) => p.trim())
            : [];

          const cons = Array.isArray(matching?.cons)
            ? matching.cons
                .filter(
                  (c): c is string => typeof c === 'string' && c.trim().length > 0,
                )
                .map((c) => c.trim())
            : [];

          return {
            name: optName,
            pros:
              pros.length > 0
                ? pros
                : ['Ponto de vista favorável ao aspecto abordado.'],
            cons:
              cons.length > 0
                ? cons
                : ['Aspecto a ser considerado ou trade-off da abordagem.'],
          };
        },
      );

      const result: ExplainPollDebateResponse = {
        pollId,
        overview,
        options: formattedOptions,
      };

      this.explanationCache.set(pollId, result);
      return result;
    } catch (error) {
      this.logger.error('Error during poll debate explanation', error);
      throw new Error('Falha ao explicar o debate da enquete');
    }
  }

  private validateSafeUrl(rawUrl: string): URL {
    if (!rawUrl || typeof rawUrl !== 'string') {
      throw new BadRequestException('A URL informada é inválida.');
    }

    let parsed: URL;
    try {
      parsed = new URL(rawUrl.trim());
    } catch {
      throw new BadRequestException('A URL informada é inválida.');
    }

    const protocol = parsed.protocol.toLowerCase();
    if (protocol !== 'http:' && protocol !== 'https:') {
      throw new BadRequestException(
        'Apenas URLs com protocolo http ou https são permitidas.',
      );
    }

    const hostname = parsed.hostname.toLowerCase();

    // Localhost checks
    if (
      hostname === 'localhost' ||
      hostname === '0.0.0.0' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local')
    ) {
      throw new BadRequestException(
        'A URL informada aponta para um endereço local ou não permitido.',
      );
    }

    // IPv6 checks
    const cleanIpv6 = hostname.replace(/^\[|\]$/g, '').toLowerCase();
    if (
      cleanIpv6 === '::1' ||
      cleanIpv6 === '::' ||
      cleanIpv6.startsWith('fe80:') ||
      cleanIpv6.startsWith('fc') ||
      cleanIpv6.startsWith('fd')
    ) {
      throw new BadRequestException(
        'A URL informada aponta para um endereço local ou não permitido.',
      );
    }

    // IPv4 checks
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = hostname.match(ipv4Regex);
    if (match) {
      const o1 = parseInt(match[1], 10);
      const o2 = parseInt(match[2], 10);
      const o3 = parseInt(match[3], 10);
      const o4 = parseInt(match[4], 10);

      if ([o1, o2, o3, o4].some((o) => o < 0 || o > 255)) {
        throw new BadRequestException(
          'A URL informada possui um endereço IP inválido.',
        );
      }

      // 0.0.0.0/8
      if (o1 === 0) {
        throw new BadRequestException(
          'A URL informada aponta para um endereço local ou não permitido.',
        );
      }
      // 127.0.0.0/8 (loopback)
      if (o1 === 127) {
        throw new BadRequestException(
          'A URL informada aponta para um endereço local ou não permitido.',
        );
      }
      // 10.0.0.0/8 (private)
      if (o1 === 10) {
        throw new BadRequestException(
          'A URL informada aponta para um endereço privado não permitido.',
        );
      }
      // 172.16.0.0/12 (private: 172.16.0.0 - 172.31.255.255)
      if (o1 === 172 && o2 >= 16 && o2 <= 31) {
        throw new BadRequestException(
          'A URL informada aponta para um endereço privado não permitido.',
        );
      }
      // 192.168.0.0/16 (private)
      if (o1 === 192 && o2 === 168) {
        throw new BadRequestException(
          'A URL informada aponta para um endereço privado não permitido.',
        );
      }
      // 169.254.0.0/16 (link-local / AWS/GCP metadata: 169.254.169.254)
      if (o1 === 169 && o2 === 254) {
        throw new BadRequestException(
          'A URL informada aponta para um endereço link-local ou de metadados não permitido.',
        );
      }
    }

    return parsed;
  }

  async generatePollFromContent(
    type: 'url' | 'text',
    content: string,
  ): Promise<GeneratePollFromContentResponse> {
    let finalText = '';

    if (type === 'url') {
      const validUrl = this.validateSafeUrl(content);

      let html: string;
      try {
        const response = await fetch(validUrl.toString(), {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (compatible; EnqueteMeBot/1.0; +https://enqueteme.com)',
            Accept: 'text/html,application/xhtml+xml,text/plain',
          },
          signal: AbortSignal.timeout(6000),
        });

        if (!response.ok) {
          throw new Error(`HTTP status ${response.status}`);
        }

        html = await response.text();
      } catch (fetchError) {
        this.logger.warn(
          `Failed to fetch URL ${validUrl.toString()}: ${fetchError}`,
        );
        throw new BadRequestException(
          'Não foi possível carregar o conteúdo da URL informada. Verifique se o link está acessível ou cole o texto diretamente.',
        );
      }

      const $ = cheerio.load(html);
      $('script, style, nav, footer, header, noscript, svg').remove();

      let extracted = $('article').text().replace(/\s+/g, ' ').trim();
      if (extracted.length < 50) {
        extracted = $('main').text().replace(/\s+/g, ' ').trim();
      }
      if (extracted.length < 50) {
        extracted = $('body').text().replace(/\s+/g, ' ').trim();
      }

      if (extracted.length < 50) {
        throw new BadRequestException(
          'O conteúdo da página é insuficiente para gerar uma enquete.',
        );
      }

      finalText = extracted.slice(0, 15000);
    } else if (type === 'text') {
      const trimmed = (content || '').trim();
      if (trimmed.length < 50) {
        throw new BadRequestException(
          'O texto informado é muito curto para gerar uma enquete relevante (mínimo de 50 caracteres).',
        );
      }
      if (trimmed.length > 20000) {
        throw new BadRequestException(
          'O texto informado excede o limite máximo permitido de 20.000 caracteres.',
        );
      }
      finalText = trimmed;
    } else {
      throw new BadRequestException(
        'Tipo de conteúdo inválido. Utilize "url" ou "text".',
      );
    }

    const systemPrompt = `Você é um especialista em metodologia de pesquisas de opinião pública, análise de conteúdo e formulação de enquetes.
Sua missão é ler um conteúdo fornecido (artigo, notícia, comunicado ou notas de discussão), identificar o dilema, debate ou trade-off central e formular uma enquete imparcial, equilibrada e de alta qualidade metodológica.

Diretrizes obrigatórias:
1. Dilema Central: Identifique o ponto central de divergência, decisão ou discussão abordado no conteúdo.
2. Título/Pergunta: Formule uma pergunta neutra, clara e envolvente em Português que sintetize esse dilema. Nunca utilize perguntas indutivas ou tendenciosas.
3. Opções de Resposta:
   - Gere entre 2 e 5 opções de resposta balanceadas, mutuamente exclusivas e representativas dos diferentes pontos de vista ou alternativas do texto.
   - O número total de opções deve ser estritamente entre 2 e 5.
4. Justificativa de Contexto (contextRationale):
   - Forneça uma explicação concisa de 1 a 2 frases em Português explicando o contexto ou por que esse debate é relevante a partir do conteúdo analisado.

IMPORTANTE: Responda estritamente em formato JSON válido com este esquema:
{
  "title": string,
  "options": string[], // lista contendo de 2 a 5 strings de opções
  "contextRationale": string // justificativa concisa do debate identificado
}
Retorne apenas o JSON puro, sem blocos markdown.`;

    try {
      const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
      const response = await this.client.chat.send({
        chatRequest: {
          model,
          responseFormat: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Identifique o debate central e gere a enquete com base no conteúdo a seguir:\n\n${finalText}`,
            },
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

      const parsed = JSON.parse(cleanJson) as GeneratePollFromContentResponse;

      const title =
        typeof parsed.title === 'string' ? parsed.title.trim() : '';
      const contextRationale =
        typeof parsed.contextRationale === 'string'
          ? parsed.contextRationale.trim()
          : '';
      const options = Array.isArray(parsed.options)
        ? parsed.options
            .map((opt) => (typeof opt === 'string' ? opt.trim() : ''))
            .filter((opt) => opt.length > 0)
            .slice(0, 5)
        : [];

      if (!title || !contextRationale || options.length < 2) {
        throw new Error(
          'O modelo não gerou uma enquete válida (título, justificativa e mínimo de 2 opções são obrigatórios).',
        );
      }

      return {
        title,
        options,
        contextRationale,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error during content-to-poll generation', error);
      throw new BadRequestException(
        error instanceof Error && error.message.includes('O modelo não gerou')
          ? error.message
          : 'Falha ao processar o conteúdo e gerar a enquete com inteligência artificial.',
      );
    }
  }
}