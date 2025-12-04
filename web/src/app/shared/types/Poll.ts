export type PollType = {
  id: number;
  title: string;
  creatorName: string;
  expirationDate: string;
  voteRequireLogin: boolean;
  options: {
    id: number;
    name: string;
    votes: number;
    votePercentage?: number;
    progressColor?: string;
  }[];
};
