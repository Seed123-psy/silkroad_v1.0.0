declare module 'shapefile' {
  export function open(source: string | ArrayBuffer, options?: any, readerOptions?: any): Promise<any>;
  export function openDbf(source: string | ArrayBuffer, options?: any): Promise<any>;
  export function parseDbf(buffer: ArrayBuffer, options?: any): any;
  const _default: any;
  export default _default;
}
