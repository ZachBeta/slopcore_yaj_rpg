declare module 'process/browser' {
  const process: {
    env: { [key: string]: string | undefined };
    browser: boolean;
    version: string;
    platform: string;
    [key: string]: any;
  };
  export default process;
} 