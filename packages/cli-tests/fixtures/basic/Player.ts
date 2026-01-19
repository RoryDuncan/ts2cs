// Basic TypeScript class for testing
export class Player {
  name: string;
  health: number;
  
  constructor(name: string) {
    this.name = name;
    this.health = 100;
  }
  
  takeDamage(amount: number): void {
    this.health -= amount;
  }
  
  isAlive(): boolean {
    return this.health > 0;
  }
}

