import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    ignores: ["src-tauri/**", "src-ui/dist/**", "**/*.d.ts"],
  },
];
