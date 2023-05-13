function divideArray<T extends string>(array?: T[]): [T[], T[]] {
  array = array ?? [];
  
  const middleIndex = Math.floor(array.length / 2);
  const firstHalf   = array.slice(0, middleIndex);
  const secondHalf  = array.slice(middleIndex);

  return [secondHalf, firstHalf];
}

console.log(divideArray(['Frys']))