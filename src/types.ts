export type PageJSON = Record<string, any>;

export interface Design {
  id: string;
  title: string;
  width: number;
  height: number;
  pages: PageJSON[];
  createdAt: number;
  updatedAt: number;
}

export interface DesignMeta {
  id: string;
  title: string;
  width: number;
  height: number;
  updatedAt: number;
  thumb?: string;
}

export interface UploadMeta {
  id: string;
  name: string;
  width: number;
  height: number;
  createdAt: number;
  thumb: string;
}

export const uid = () =>
  (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36)).replace(/-/g, '').slice(0, 16);
