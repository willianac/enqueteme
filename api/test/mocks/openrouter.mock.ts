export class OpenRouter {
  chat = {
    send: jest.fn().mockImplementation((params?: any) => {
      const systemMessage = params?.chatRequest?.messages?.find(
        (m: any) => m.role === 'system',
      )?.content || '';

      if (systemMessage.includes('gerar uma enquete') || systemMessage.includes('design de questionários')) {
        return Promise.resolve({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  title: 'Qual o melhor banco de dados para analytics em tempo real?',
                  options: [
                    'ClickHouse',
                    'Apache Pinot',
                    'Rockset / Databricks',
                    'PostgreSQL com TimescaleDB',
                    'Outro / Ver resultados',
                  ],
                }),
              },
            },
          ],
        });
      }

      return Promise.resolve({
        choices: [
          {
            message: {
              content: JSON.stringify({
                isNeutral: true,
                score: 90,
                summary: 'A enquete apresenta uma formulação equilibrada e opções claras.',
                issues: [],
                suggestedTitle: null,
                suggestedOptionsToAdd: [],
              }),
            },
          },
        ],
      });
    }),
  };
}

