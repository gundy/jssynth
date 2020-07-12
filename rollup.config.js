import typescript from 'rollup-plugin-typescript2'

import pkg from './package.json'
import {terser} from 'rollup-plugin-terser';

export default [{
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
    },
    {
      file: pkg.module,
      format: 'es',
    }
  ],
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ],

  plugins: [
    typescript({
      typescript: require('typescript'),
   	  objectHashIgnoreUnknownHack: true
    }),
  ],
},

  /* ---- */
  {
    input: 'src/index.standalone.ts',
    output: [
      {
        file: pkg.standalone,
        format: 'iife',
      },
	{
		file: pkg.standalone_min,
		format: 'iife',
		name: 'jssynth',
		plugins: [terser()]
	}
    ],
    external: [
      ...Object.keys(pkg.dependencies || {}),
      ...Object.keys(pkg.peerDependencies || {}),
    ],

    plugins: [
      typescript({
        typescript: require('typescript'),
	    objectHashIgnoreUnknownHack: true
 	  }),
    ],
  },


]
