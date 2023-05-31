import { roaringWasm } from "./roaring-wasm";

export let _free_finalizationRegistry: FinalizationRegistry<number> | undefined;

export const _free_finalizationRegistry_init = (
  typeof FinalizationRegistry !== "undefined"
    ? () => {
        return (_free_finalizationRegistry = new FinalizationRegistry(roaringWasm._free));
      }
    : () => {}
) as () => FinalizationRegistry<number> | undefined;
