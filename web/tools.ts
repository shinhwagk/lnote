export const intersection = (array1: string[], array2: string[]) => array1.filter((e) => array2.indexOf(e) !== -1);

export const issubset = (child: string[], father: string[]) => child.filter((e) => father.indexOf(e) !== -1).length === child.length;
