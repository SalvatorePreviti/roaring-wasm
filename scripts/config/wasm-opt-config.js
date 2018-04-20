function buildWasmOptArgs() {
  const args = []

  args.push('--ignore-implicit-traps')
  args.push('--coalesce-locals-learning')
  args.push('--code-folding')
  args.push('--code-pushing')
  args.push('--dce')
  args.push('--duplicate-function-elimination')
  args.push('--inlining-optimizing')
  args.push('--legalize-js-interface')
  args.push('--local-cse')
  args.push('--merge-blocks')
  args.push('--merge-locals')
  args.push('--optimize-instructions')
  args.push('--pick-load-signs')
  args.push('--post-emscripten')
  args.push('--precompute-propagate')
  args.push('--remove-unused-brs')
  args.push('--remove-unused-module-elements')
  args.push('--remove-unused-names')
  args.push('--reorder-functions')
  args.push('--reorder-locals')
  args.push('--rse')
  args.push('--simplify-locals')
  args.push('--vacuum')

  return args
}

const config = {
  args: buildWasmOptArgs()
}

module.exports = config
