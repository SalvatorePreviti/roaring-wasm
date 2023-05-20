import "mocha/mocha.css";
import "./styles.css";
import "mocha";

const progressEl = document.getElementById("progress")!;
let setupCompleted = false;
let failedTests = 0;

const fail = (message: string) => {
  if (failedTests) {
    message += ` ${failedTests} failure${failedTests === 1 ? "" : "s"}.`;
  }
  const inner = document.createElement("div");
  inner.innerText = message.trim();
  inner.className = "failed";
  progressEl.innerHTML = `❌ &nbsp;<span id="completed-status" class="failed">${message}.</span>`;
  document.body.appendChild(document.createTextNode(message));
};

const pass = () => {
  progressEl.classList.remove("running");
  progressEl.classList.add("passed");
  progressEl.innerHTML = '✅ &nbsp; <span id="completed-status" class="passed">All good!</span>';
};

try {
  mocha.setup({ ui: "bdd" });

  const tests = await import.meta.glob("../**/*.test.ts");

  for (const path in tests) {
    await tests[path]();
  }

  const runner = mocha.run();

  runner.on("fail", () => {
    ++failedTests;
  });

  runner.on("end", () => {
    if (failedTests) {
      fail("");
    } else {
      pass();
    }
  });
  setupCompleted = true;
} finally {
  if (!setupCompleted) {
    fail("Initialization failed");
  }
}
