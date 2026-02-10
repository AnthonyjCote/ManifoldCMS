export type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | {
      [key: string]: Json;
    };

export type JsonObject = {
  [key: string]: Json;
};

export type ProjectFileMap = Map<string, unknown>;
