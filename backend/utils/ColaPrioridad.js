class MaxHeap {
  constructor() {
    this.heap = [];
  }

  // Métodos de navegación del árbol binario
  parentIndex(i) { return Math.floor((i - 1) / 2); }
  leftChildIndex(i) { return 2 * i + 1; }
  rightChildIndex(i) { return 2 * i + 2; }

  swap(i, j) {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }

  // 1. Inserción con complejidad O(log n)
  insert(pedido) {
    this.heap.push(pedido);
    this.heapifyUp(this.heap.length - 1);
  }

  heapifyUp(index) {
    while (
      index > 0 && 
      this.heap[this.parentIndex(index)].prioridadCalculada < this.heap[index].prioridadCalculada
    ) {
      this.swap(this.parentIndex(index), index);
      index = this.parentIndex(index);
    }
  }

  // 2. Extracción del elemento de mayor prioridad con O(log n)
  extractMax() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();

    const max = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.heapifyDown(0);
    return max;
  }

  heapifyDown(index) {
    let maxIndex = index;
    const left = this.leftChildIndex(index);
    const right = this.rightChildIndex(index);
    const length = this.heap.length;

    // Compara el nodo actual con sus hijos para mantener la propiedad del Max-Heap
    if (left < length && this.heap[left].prioridadCalculada > this.heap[maxIndex].prioridadCalculada) {
      maxIndex = left;
    }
    if (right < length && this.heap[right].prioridadCalculada > this.heap[maxIndex].prioridadCalculada) {
      maxIndex = right;
    }
    if (index !== maxIndex) {
      this.swap(index, maxIndex);
      this.heapifyDown(maxIndex);
    }
  }

  // Método auxiliar para ordenar toda la cola vaciando el heap
  sort() {
    const sorted = [];
    while (this.heap.length > 0) {
      sorted.push(this.extractMax());
    }
    return sorted;
  }
}

/**
 * Motor de Reglas de Negocio: Calcula la prioridad absoluta.
 * Prioridad Base: A TIEMPO (100) > ANTICIPADO (50) > TARDÍO (10)
 * Política de Aging: Se suma (minutosEnEspera * factorAging) para evitar inanición (starvation).
 */
const calcularPrioridad = (estadoLlegada, minutosEnEspera, factorAging) => {
  let puntajeBase = 0;

  switch (estadoLlegada) {
    case 'A TIEMPO':
      puntajeBase = 100;
      break;
    case 'ANTICIPADO':
      puntajeBase = 50;
      break;
    case 'TARDÍO':
      puntajeBase = 10;
      break;
    default:
      puntajeBase = 0;
  }

  // Fórmula de Envejecimiento (Aging)
  const puntajeAging = minutosEnEspera * factorAging;
  
  return puntajeBase + puntajeAging;
};

module.exports = {
  MaxHeap,
  calcularPrioridad
};