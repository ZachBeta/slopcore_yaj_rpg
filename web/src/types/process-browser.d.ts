declare module 'process/browser' {
  const process: {
    env: { [key: string]: string | undefined };
    browser: boolean;
    version: string;
    platform: string;
    [key: string]: unknown;
  };
  export default process;
}
