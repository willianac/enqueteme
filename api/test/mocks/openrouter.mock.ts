export class OpenRouter {
  chat = {
    send: jest.fn().mockResolvedValue({
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
    }),
  };
}
