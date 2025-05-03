import { generateCombinations } from "$utils/pattern";
import { DisposeCallback } from "$types/DisposeCallback";
import { ButtonHandlerOptions, ChatInputOptions, EmitOptions, InspectorOptions, ModalHandlerOptions, SelectMenuHandlerOptions } from "$types/InspectorOptions";

export class Inspector {
    public readonly id: string;
    public readonly domain: "CurrentPack" | "AllSubPacks";

    private chatInputCombinationsMap: Map<string, string> = new Map();
    private chatInputHandlers: Map<string, (ctx: any) => void | Promise<void>> = new Map();
    private buttonHandlers: Map<string, ButtonHandlerOptions['handle']> = new Map();
    private selectMenuHandlers: Map<string, SelectMenuHandlerOptions['handle']> = new Map();
    private modalHandlers: Map<string, ModalHandlerOptions['handle']> = new Map();

    constructor(options: InspectorOptions) {
        this.id = options.id;
        this.domain = options.domain;
    }

    async emit(options: EmitOptions): Promise<boolean | void> {
        const { type, id, ctx } = options;
        try {
            switch (type) {
                case 'chatInput':
                    // Look up the original pattern that this ID is a combination of
                    const originalPattern = this.chatInputCombinationsMap.get(id);
                    if (originalPattern) {
                        const handler = this.chatInputHandlers.get(originalPattern);
                        if (handler) {
                            return await handler(ctx);
                        }
                    }
                    break;
                    
                case 'button':
                    const buttonHandler = this.buttonHandlers.get(id);
                    if (buttonHandler) {
                        return await buttonHandler(ctx);
                    }
                    break;
                    
                case 'selectMenu':
                    const selectMenuHandler = this.selectMenuHandlers.get(id);
                    if (selectMenuHandler) {
                        return await selectMenuHandler(ctx);
                    }
                    break;
                    
                case 'modal':
                    const modalHandler = this.modalHandlers.get(id);
                    if (modalHandler) {
                        return await modalHandler(ctx);
                    }
                    break;
                    
                default:
            }
        } catch {}
        
        return;
    }

    chatInput(options: ChatInputOptions): DisposeCallback {
        const { pattern, handle } = options;
        
        this.chatInputHandlers.set(pattern, handle);
        
        const combinations = generateCombinations(pattern);
        
        for (const combo of combinations) {
            this.chatInputCombinationsMap.set(combo, pattern);
        }

        return () => {
            for (const combo of combinations) {
                this.chatInputCombinationsMap.delete(combo);
            }
            
            this.chatInputHandlers.delete(pattern);
        };
    }

    button(options: ButtonHandlerOptions): DisposeCallback {
        this.buttonHandlers.set(options.id, options.handle);

        return () => {
            this.buttonHandlers.delete(options.id);
        };
    }

    selectMenu(options: SelectMenuHandlerOptions): DisposeCallback {
        this.selectMenuHandlers.set(options.id, options.handle);

        return () => {
            this.selectMenuHandlers.delete(options.id);
        };
    }

    modal(options: ModalHandlerOptions): DisposeCallback {
        this.modalHandlers.set(options.id, options.handle);

        return () => {
            this.modalHandlers.delete(options.id);
        };
    }
}