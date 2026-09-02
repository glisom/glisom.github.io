const EXPECTED_NODE = '24.20.0';
const EXPECTED_NPM = '11.19.0';
const actualNpm =
  process.env.npm_config_user_agent?.match(/^npm\/([^ ]+)/)?.[1];

if (process.versions.node !== EXPECTED_NODE || actualNpm !== EXPECTED_NPM) {
  throw new Error(
    `Expected Node ${EXPECTED_NODE} / npm ${EXPECTED_NPM}; received Node ${process.versions.node} / npm ${actualNpm ?? 'unknown'}`,
  );
}
