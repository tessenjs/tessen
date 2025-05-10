type OmitRecursive<T, K extends PropertyKey> = T extends (infer E)[] // T bir dizi mi?
  ? OmitRecursive<E, K>[] // Evet ise, elemanlar üzerinde özyinele ve bir dizi döndür
  : T extends object // T bir nesne mi (ve dizi değil, çünkü onu yukarıda yakaladık)?
  ? {
    // Nesnenin her bir P anahtarı için...
    [P in keyof T as P extends K ? never : P]: // Eğer P, K ise bu anahtarı atla (never)
    OmitRecursive<T[P], K>; // Değilse, P anahtarını tut ve değeri üzerinde özyinele
  }
  : T;