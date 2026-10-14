export interface PageData {
  url: string;
  title: string;
  selection: string;
  description: string;
  text: string;
  links: { text: string; href: string }[];
}

export type Message =
  | { type: "GET_PAGE_DATA" }
  | { type: "CALL_API"; endpoint: string; auth?: string; payload: unknown };

export interface ApiResult {
  ok: boolean;
  status: number;
  body: string;
}
