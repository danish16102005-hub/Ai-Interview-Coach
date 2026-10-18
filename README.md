# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## Local interview agent

The interview UI connects to the existing `my_agent` ADK application at
`http://127.0.0.1:8000`. Start that API server and the configured local Ollama
model before running the frontend with `npm run dev` from this directory. Vite
proxies `/adk` requests to ADK during development, so the browser does not need
cross-origin access to port 8000.

Interview history is saved in browser `localStorage` only when a session is
completed with **Done**. Offline operation depends on the existing local ADK,
Ollama, model, and installed dependencies; it has not been independently
verified.

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
