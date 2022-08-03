declare module '*.css' {
  const css: any;

  export function use(): void;

  export function unuse(): void;

  export default css;
}
