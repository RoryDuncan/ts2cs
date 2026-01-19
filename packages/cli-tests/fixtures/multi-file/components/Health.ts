// Health component
export class HealthComponent {
  current: number;
  max: number;
  
  constructor(max: number) {
    this.max = max;
    this.current = max;
  }
  
  damage(amount: number): void {
    this.current = Math.max(0, this.current - amount);
  }
  
  heal(amount: number): void {
    this.current = Math.min(this.max, this.current + amount);
  }
  
  isDead(): boolean {
    return this.current <= 0;
  }
}


