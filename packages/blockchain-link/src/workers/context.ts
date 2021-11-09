import WorkerCommon from './common';
import type { Message, Response } from '../types';

// main goal is to make no difference from the implementation point of view (parent) between:
// const w = new Worker('path-to-file.js'); w.postMessage('*');
// and
// const w = new BlockchainLinkModule('ignored-path-to-file.js'); w.postMessage('*');

// tsconfig is using "dom" in compilerOptions
// TODO: is there a way how to set different compilerOptions only for "workers" directory? is it worth it?
declare const WorkerGlobalScope: ObjectConstructor | undefined;
declare const self: any;
declare const importScripts: any;

export const getContext = <T>(state: T) => {
    // if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
    if (
        (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) ||
        typeof importScripts !== 'undefined'
    ) {
        // running in Worker context. module wrapper will not be used.
        const common = new WorkerCommon(self.postMessage);
        return {
            ctx: self,
            common,
            state,
            BlockchainLinkModule: () => {},
        };
    }

    // running in main thread context.
    // @ts-ignore
    console.warn('RUNNING IN MAIN?' /* , typeof self.close */);

    // interface of web Worker returned from constructor of BlockchainLinkModule (below) and used by parent
    const worker = {
        postMessage: (_data: Message) => {}, // override by BlockchainLinkModule constructor, used by parent
        terminate: () => {}, // override by BlockchainLinkModule constructor
        onmessage: (_evt: { data: Response }) => {}, // override by parent
        onmessageerror: (_error: Error) => {}, // override by parent
        onerror: (_error: Error) => {}, // override by parent
        // is it worth to implement them?
        addEventListener: () => {
            throw new Error('Method not implemented.');
        },
        removeEventListener: () => {
            throw new Error('Method not implemented.');
        },
        dispatchEvent: () => {
            throw new Error('Method not implemented.');
        },
    };

    // Context of /workers/*/index.ts
    // interface of WorkerGlobalScope used only in main thread context.
    const ctx = {
        postMessage: (data: Response) => worker.onmessage({ data }), // send message from Context to parent
        onmessage: (_evt: { data: Message }) => {}, // override by Context
    };

    const common = new WorkerCommon(ctx.postMessage);

    // constructor of module (pseudo Worker). used by parent
    const BlockchainLinkModule = (_file: string) => {
        // send message from parent to Context
        worker.postMessage = (data: Message) => ctx.onmessage({ data });
        // unlike the real Worker module will not auto-dispose. trigger it by passing message to Context
        // @ts-ignore missing terminate // TODO
        worker.terminate = () => worker.postMessage({ type: 'terminate' });

        // send handshake to parent
        // timeout is necessary here since Worker.onmessage listener (in parent) is set after this constructor
        setTimeout(() => {
            ctx.postMessage({ id: -1, type: 'm_handshake' });
        }, 1);

        return worker;
    };

    return {
        ctx,
        common,
        state,
        BlockchainLinkModule,
    };
};
