const tests = [
  ['Onboarding State Resolver', '../tests/onboarding-state.test.mjs'],
  ['Permission Access Policy', '../tests/permission-access.test.mjs'],
  ['Development Preview Policy', '../tests/development-preview.test.mjs'],
  ['Reporting Line Policy', '../tests/reporting-line-policy.test.mjs'],
  ['Employee Assignment Policy', '../tests/employee-assignment-policy.test.mjs'],
  ['Organization Chart Policy', '../tests/organization-chart-policy.test.mjs'],
];

let failed = 0;
for (const [name, modulePath] of tests) {
  try {
    const test = await import(modulePath);
    await test.run();
    console.log(`PASS  ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL  ${name}`);
    console.error(error?.stack || error);
  }
}

if (failed) {
  console.error(`\n${failed} unit test suite(s) failed.`);
  process.exit(1);
}

console.log(`\nAll ${tests.length} Q BMS unit test suites passed.`);
