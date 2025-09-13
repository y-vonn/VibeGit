export interface HealthResponse {
  status: string;
  time: string;
  build: { version: string; time: string };
}
