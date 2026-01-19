// Test file for array transform options
export class ArrayTest {
  items: string[];
  numbers: number[];
  
  constructor() {
    this.items = [];
    this.numbers = [];
  }
  
  addItem(item: string): void {
    this.items.push(item);
  }
  
  getNumbers(): number[] {
    return this.numbers;
  }
}


