/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POLKADOT_RPC?: string;
  readonly VITE_EVM_RPC?: string;
  readonly VITE_SUBSCAN_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
