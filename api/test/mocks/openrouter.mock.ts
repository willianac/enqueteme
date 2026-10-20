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

      if (
        systemMessage.includes('análise de conteúdo') ||
        systemMessage.includes('dilema central') ||
        systemMessage.includes('contextRationale')
      ) {
        return Promise.resolve({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  title: 'Qual arquitetura adotar para a nova release?',
                  options: [
                    'Monólito Modular',
                    'Microsserviços Distribuídos',
                    'Serverless / Edge',
                  ],
                  contextRationale:
                    'O conteúdo debate os trade-offs entre simplicidade operacional do monólito versus independência dos microsserviços.',
                }),
              },
            },
          ],
        });
      }

      if (systemMessage.includes('contexto do debate') || systemMessage.includes('explicar para um participante')) {
        return Promise.resolve({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  overview:
                    'O debate compara diferentes abordagens tecnológicas considerando performance, complexidade e ecossistema.',
                  options: [
                    {
                      name: 'TypeScript',
                      pros: ['Tipagem estática que previne erros em tempo de compilação', 'Ecossistema rico e maduro no Node.js'],
                      cons: ['Curva de aprendizado adicional', 'Requer etapa de compilação (build step)'],
                    },
                    {
                      name: 'Python',
                      pros: ['Sintaxe limpa e alta produtividade inicial', 'Líder absoluto em ecossistema de dados e IA'],
                      cons: ['Desempenho de execução inferior em workloads intensivas', 'Verificação de tipos dinâmica em runtime'],
                    },
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

