/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_HOST: string
}

// eslint-disable-next-line no-unused-vars
interface ImportMeta {
    readonly env: ImportMetaEnv
}
