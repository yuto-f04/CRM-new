/** @type {import('postcss-load-config').Config} */
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},   // v4 の正しい指定
    autoprefixer: {},
  },
};
