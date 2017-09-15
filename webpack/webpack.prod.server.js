const webpack = require('webpack');
const path = require('path');
const webpackDevServer = require('webpack-dev-server');
const chalk = require('chalk');
const config = require('./webpack.prod.config');

const PORT = 3002;
const HOST = '0.0.0.0';

console.log(
  chalk.bold('Options:\n') +
  chalk.gray('-----------------------------------\n') +
  chalk.cyan('Source: ') + path.join(process.cwd(), 'src') + '\n' +
  chalk.gray('-----------------------------------\n')
);
console.log('Starting server from dist folder...');

new webpackDevServer(webpack(config), {
  publicPath: config.output.publicPath,
  filename: config.output.filename,
  contentBase: config.output.path,
  historyApiFallback: true,
  quiet: true, // Without logging
})
.listen(PORT, HOST, err => {
  if (err) {
    console.log(err);
  } else {
    console.log('Server started ' + chalk.green('✓'));
    console.log(
      chalk.bold('\nAccess URLs:') +
      chalk.gray('\n-----------------------------------') +
      '\n   Local: ' + chalk.magenta('http://' + HOST + ':' + PORT) +
      chalk.gray('\n-----------------------------------')
    );
    console.log(chalk.red('\nPress ' + chalk.italic('CTRL-C') + ' to stop'));
  }
});

module.exports = config;
