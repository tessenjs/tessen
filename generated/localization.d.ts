import { ContentValue } from "../src/lib/Locale";

// Global declaration for Tessen localization types
declare global {
    namespace Tessen {
        interface Localization extends ContentValue {
            // This interface can be extended via module augmentation
            // Example:
            // declare global {
            //     namespace Tessen {
            //         interface Localization {
            //             hello: () => string;
            //             world: (param: string) => string;
            //             nested: {
            //                 welcome: (username: string) => string;
            //             };
            //         }
            //     }
            // }
        }
    }
}

// Export empty object to make this a module
export {};
