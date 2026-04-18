export interface Position {
  x: number;
  y: number;
}

export interface CanvasContext {
  nearbyContent: string[];
  userHistory: string[];
  currentTheme?: string;
}

export interface AnchorPoint {
  id: string;
  position: Position;
  createdAt: number;
}