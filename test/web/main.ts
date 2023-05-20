import "mocha/mocha.css";
import "./styles.css";
import "mocha";

mocha.setup({ ui: "bdd" });

const tests = await import.meta.glob("../**/*.test.ts");

for (const path in tests) {
  await tests[path]();
}

const runner = mocha.run();

let failedTests = 0;
runner.on("fail", () => {
  ++failedTests;
});

runner.on("end", () => {
  const progressEl = document.getElementById("progress")!;
  if (failedTests > 0) {
    progressEl.classList.add("failed");
    progressEl.innerHTML = `❌ &nbsp; Failed, ${failedTests} failure${failedTests === 1 ? "" : "s"}.`;
  } else {
    progressEl.classList.add("passed");
    progressEl.innerHTML = "✅ &nbsp; All good!";
  }
});
