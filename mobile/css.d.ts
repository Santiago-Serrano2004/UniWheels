// El scaffold de Expo (SDK 57) importa .css/.module.css (theme.ts,
// animated-icon.web.tsx, y ahora _layout.tsx para NativeWind) sin declarar sus
// tipos — Metro los bundlea bien sin esto, pero `tsc --noEmit` los marca como
// módulo no encontrado. Declaración mínima para que el chequeo de tipos pase.
declare module '*.css';
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}
