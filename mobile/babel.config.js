module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Remove plugins for now until we know they're needed
    plugins: [],
  };
};