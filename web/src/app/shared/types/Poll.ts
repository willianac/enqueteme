export type PollType = {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  voteRequireLogin: boolean;
  expirationDate: string;
  user: {
    id: number;
    name: string;
  };
  options: {
    id: number;
    name: string;
    votes: number;
  }[];
};
