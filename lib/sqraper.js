var http = require('http'),
    urlParser = require('url').parse,
    jsdom = require('jsdom'),
    Iconv = require('iconv').Iconv;
require('buffertools');

module.exports = function(url, callback) {
  if (!callback) throw new Error('Callback is not specified'); 
  if (!url) return callback(new Error('URL is not specified'));

  var parsedUrl = urlParser(url);
  var options = {
    host: parsedUrl.hostname,
    port: parsedUrl.port,
    path: parsedUrl.pathname + (parsedUrl.search || '')
  };

  http.get(options, function(res) {
    if (res.statusCode !== 200) return callback(
      new Error('URL: ' + url + ', StatusCode: ' + res.statusCode), null);
    var contentType = res.headers['content-type'];
    var charset = contentType && contentType.toLowerCase().match(/charset\=(.*)/i)[1];
    var iconv, buf;
    if (charset === 'shift_jis' || charset === 'shiftjis' || charset === 'sjis') {
      buf = new Buffer('');
      iconv = new Iconv('Shift_JIS', 'UTF-8//TRANSLIT//IGNORE');
    } else if (charset === 'euc-jp' || charset === 'euc_jp' || charset === 'eucjp') {
      buf = new Buffer('');
      iconv = new Iconv('EUC-JP', 'UTF-8//TRANSLIT//IGNORE');
    } else if (charset === 'iso-2022-jp') {
      buf = new Buffer('');
      iconv = new Iconv('ISO-2022-JP', 'UTF-8//TRANSLIT//IGNORE');
    } else {
      buf = '';
      res.setEncoding('utf8');
    }

    res.on('data', function(chunk) {
      if (iconv) {
        buf = buf.concat(chunk);
      } else {
        buf += chunk;
      }
    });

    res.on('end', function() {
      if (iconv) {
        buf = iconv.convert(buf).toString('utf8');
      }
      jsdom.env( {
        html: buf,
        scripts: ['http://code.jquery.com/jquery.min.js']
      }, function(err, window) {
        callback(null, window.jQuery);
      });
    });

    res.on('error', function(err) {
      callback(err, null);
    });
  });
};
