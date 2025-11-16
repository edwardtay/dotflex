/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POLKADOT_RPC?: string;
  readonly VITE_EVM_RPC?: string;
  readonly VITE_DOTFLEX_API_KEY?: string;
  // add any other VITE_ variables you use
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
