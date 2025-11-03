export interface HistoricalItem {
  year: string;
  text: string;
  html: string;
  links: Array<{
    title: string;
    link: string;
  }>;
}

export interface HistoryData {
  date: string;
  url: string;
  data: {
    Events: HistoricalItem[];
    Births: HistoricalItem[];
    Deaths: HistoricalItem[];
  };
}
