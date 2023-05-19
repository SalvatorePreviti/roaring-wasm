import "mocha";
mocha.setup({ ui: "bdd" });

import.meta.globEager("../**/*.test.ts");

// for (const path in modules) {
//   modules[path].default();
// }
