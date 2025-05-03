export type InspectorOptions = {
    id: string;
    domain: "CurrentPack" | "AllSubPacks";
};

export type ButtonHandlerOptions = {
    id: string;
    handle: (ctx: any) => void | Promise<void>;
};

export type SelectMenuHandlerOptions = {
    id: string;
    handle: (ctx: any) => void | Promise<void>;
};

export type ModalHandlerOptions = {
    id: string;
    handle: (ctx: any) => void | Promise<void>;
};

export type EmitOptions = {
    type: 'chatInput' | 'button' | 'selectMenu' | 'modal';
    id: string;
    ctx: any;
};

export type ChatInputOptions = {
    pattern: string;
    handle: (ctx: any) => void | Promise<void>;
};