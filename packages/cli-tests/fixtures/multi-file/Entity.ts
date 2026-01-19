// Base entity class
export abstract class Entity {
  id: string;
  x: number;
  y: number;
  
  constructor(id: string) {
    this.id = id;
    this.x = 0;
    this.y = 0;
  }
  
  abstract update(): void;
}


