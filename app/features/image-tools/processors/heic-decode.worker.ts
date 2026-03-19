// NOTE: heic2any requires DOM canvas (document.createElement("canvas"))
// and therefore CANNOT run in a Web Worker. HEIC decoding runs on the main
// thread via decodeHeic() in heic-to-jpg.ts / convert-image.ts instead.
// This file is kept as a tombstone to explain why there is no worker.
export {};
