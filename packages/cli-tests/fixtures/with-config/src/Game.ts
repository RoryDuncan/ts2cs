// Game class to test config file loading
export class Game {
  score: number;
  players: string[];
  
  constructor() {
    this.score = 0;
    this.players = [];
  }
  
  addPlayer(name: string): void {
    this.players.push(name);
  }
  
  incrementScore(amount: number): void {
    this.score += amount;
  }
}

