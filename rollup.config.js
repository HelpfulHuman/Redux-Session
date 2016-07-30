import buble from 'rollup-plugin-buble';

export default {
  entry: 'src/index.js',
  format: 'cjs',
  plugins: [ buble() ],
  dest: 'dist/index.js'
};
