export type PollType = {
  id: number;
  title: string;
  creatorName: string;
  expirationDate: string;
  voteRequireLogin: boolean;
  allowMultiple?: boolean;
  maxChoices?: number | null;
  totalVoters?: number;
  options: {
    id: number;
    name: string;
    votes: number;
    votePercentage?: number;
    progressColor?: string;
  }[];
  hasVoted?: boolean;
  votedOptionIds?: number[];
  votedOptionId?: number | null;
};
