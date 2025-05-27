import path from "path";
import "./colors";

export * from "./exports";

export * from "$lib/Pack";
export * from "$lib/Tessen";
export * from "$lib/Locale";

export const GENERATED_LOCALIZATION_PATH = path.resolve(
    __dirname,
    "../generated/localization.d.ts"
)