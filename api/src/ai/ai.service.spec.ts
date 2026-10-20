import { BadRequestException } from '@nestjs/common';
import { AiService } from './ai.service';

describe('AiService - generatePollFromContent', () => {
  let service: AiService;
  let mockChatSend: jest.Mock;

  beforeEach(() => {
    service = new AiService();
    mockChatSend = jest.fn();
    (service as any).client = {
      chat: {
        send: mockChatSend,
      },
    };
  });

  describe('Anti-SSRF and URL Validation', () => {
    it('rejects invalid or malformed URL', async () => {
      await expect(
        service.generatePollFromContent('url', 'invalid-url'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects unsupported protocols (ftp, file, javascript)', async () => {
      await expect(
        service.generatePollFromContent('url', 'ftp://example.com/doc'),
      ).rejects.toThrow('Apenas URLs com protocolo http ou https são permitidas.');

      await expect(
        service.generatePollFromContent('url', 'file:///etc/passwd'),
      ).rejects.toThrow('Apenas URLs com protocolo http ou https são permitidas.');
    });

    it('rejects localhost and 0.0.0.0', async () => {
      await expect(
        service.generatePollFromContent('url', 'http://localhost:8080/secret'),
      ).rejects.toThrow('A URL informada aponta para um endereço local ou não permitido.');

      await expect(
        service.generatePollFromContent('url', 'http://0.0.0.0:3000'),
      ).rejects.toThrow('A URL informada aponta para um endereço local ou não permitido.');
    });

    it('rejects 127.0.0.1 (loopback IP)', async () => {
      await expect(
        service.generatePollFromContent('url', 'http://127.0.0.1:8080'),
      ).rejects.toThrow('A URL informada aponta para um endereço local ou não permitido.');
    });

    it('rejects RFC 1918 private IPv4 ranges (10.x, 172.16-31.x, 192.168.x)', async () => {
      await expect(
        service.generatePollFromContent('url', 'http://10.0.0.1/admin'),
      ).rejects.toThrow('A URL informada aponta para um endereço privado não permitido.');

      await expect(
        service.generatePollFromContent('url', 'http://172.16.0.10/status'),
      ).rejects.toThrow('A URL informada aponta para um endereço privado não permitido.');

      await expect(
        service.generatePollFromContent('url', 'http://192.168.1.1/router'),
      ).rejects.toThrow('A URL informada aponta para um endereço privado não permitido.');
    });

    it('rejects cloud metadata link-local address 169.254.169.254', async () => {
      await expect(
        service.generatePollFromContent('url', 'http://169.254.169.254/latest/meta-data'),
      ).rejects.toThrow('A URL informada aponta para um endereço link-local ou de metadados não permitido.');
    });

    it('rejects IPv6 loopback [::1]', async () => {
      await expect(
        service.generatePollFromContent('url', 'http://[::1]:8080'),
      ).rejects.toThrow('A URL informada aponta para um endereço local ou não permitido.');
    });
  });

  describe('Text Content Validation', () => {
    it('rejects text content with fewer than 50 characters', async () => {
      await expect(
        service.generatePollFromContent('text', 'Texto muito curto'),
      ).rejects.toThrow(
        'O texto informado é muito curto para gerar uma enquete relevante (mínimo de 50 caracteres).',
      );
    });

    it('rejects text content exceeding 20000 characters', async () => {
      const longText = 'a'.repeat(20001);
      await expect(
        service.generatePollFromContent('text', longText),
      ).rejects.toThrow(
        'O texto informado excede o limite máximo permitido de 20.000 caracteres.',
      );
    });
  });

  describe('URL Fetch and HTML Parsing', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it('throws friendly BadRequestException when fetch fails or status is not ok', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
      } as any);

      await expect(
        service.generatePollFromContent('url', 'https://example.com/not-found'),
      ).rejects.toThrow(
        'Não foi possível carregar o conteúdo da URL informada. Verifique se o link está acessível ou cole o texto diretamente.',
      );
    });

    it('throws BadRequestException when extracted text is less than 50 characters', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: async () => '<html><body><script>var x = 1;</script><p>Curto</p></body></html>',
      } as any);

      await expect(
        service.generatePollFromContent('url', 'https://example.com/short'),
      ).rejects.toThrow('O conteúdo da página é insuficiente para gerar uma enquete.');
    });

    it('successfully extracts text, removes scripts and nav, and calls AI model', async () => {
      const html = `
        <html>
          <head><style>.ad { color: red; }</style></head>
          <body>
            <header><nav>Home | Contato</nav></header>
            <main>
              <article>
                <h1>O Futuro do Trabalho Híbrido</h1>
                <p>Muitas empresas de tecnologia estão revendo as políticas de home office e trabalho presencial em 2026. Líderes debatem se a produtividade individual compensa o alinhamento de equipe.</p>
              </article>
            </main>
            <footer>Todos os direitos reservados.</footer>
          </body>
        </html>
      `;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: async () => html,
      } as any);

      mockChatSend.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Qual modelo de trabalho sua empresa deveria adotar?',
                options: ['100% Remoto', 'Híbrido flexível', '100% Presencial'],
                contextRationale: 'O artigo debate os trade-offs entre produtividade no home office e coesão presencial.',
              }),
            },
          },
        ],
      });

      const result = await service.generatePollFromContent('url', 'https://example.com/artigo-trabalho');

      expect(result.title).toBe('Qual modelo de trabalho sua empresa deveria adotar?');
      expect(result.options).toHaveLength(3);
      expect(result.contextRationale).toContain('trade-offs');
    });
  });

  describe('OpenRouter generation from text', () => {
    it('successfully parses valid model response', async () => {
      const text =
        'A comunidade de desenvolvedores debate a migração de monólitos para arquiteturas serverless. Enquanto serverless reduz custos de ociosidade, pode aumentar a complexidade de observabilidade e cold starts.';

      mockChatSend.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Serverless é a melhor escolha para novas aplicações?',
                options: ['Sim, para reduzir custos operacionais', 'Não, complexidade de observabilidade não compensa'],
                contextRationale: 'O debate discute vantagens de custo versus desafios operacionais.',
              }),
            },
          },
        ],
      });

      const result = await service.generatePollFromContent('text', text);

      expect(result.title).toBe('Serverless é a melhor escolha para novas aplicações?');
      expect(result.options).toEqual([
        'Sim, para reduzir custos operacionais',
        'Não, complexidade de observabilidade não compensa',
      ]);
      expect(result.contextRationale).toBe(
        'O debate discute vantagens de custo versus desafios operacionais.',
      );
    });

    it('throws BadRequestException when model returns invalid shape (< 2 options)', async () => {
      const text =
        'Texto com mais de cinquenta caracteres suficientes para ser aprovado na validação inicial do serviço.';

      mockChatSend.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Pergunta sem opções suficientes',
                options: ['Apenas uma opção'],
                contextRationale: 'Contexto qualquer.',
              }),
            },
          },
        ],
      });

      await expect(service.generatePollFromContent('text', text)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
