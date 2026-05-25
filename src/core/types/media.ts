/** Generic media URI — local file path today, CDN URL tomorrow */
export type MediaUri = string;

export interface MediaItem {
  id: string;
  uri: MediaUri;
  type: 'image' | 'video' | 'pdf';
  createdAt: string;
}
