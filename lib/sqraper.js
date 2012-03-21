var http = require('http'),
    URL = require('url'),
    jsdom = require('jsdom'),
    Iconv = require('iconv').Iconv;
require('buffertools');

module.exports = function sqrape(url, callback) {
  if (!callback) throw new Error('Callback is not specified'); 
  if (!url) return callback(new Error('URL is not specified'));

  var parsedUrl = URL.parse(url);
  var options = {
    host: parsedUrl.hostname,
    port: parsedUrl.port,
    path: parsedUrl.pathname + (parsedUrl.search || ''),
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.7; rv:11.0) Gecko/20100101 Firefox/11.0'
    }
  };

  http.get(options, function(res) {
    if ([301, 302, 303, 307].indexOf(res.statusCode) !== -1) {
      if (res.headers["location"]) {
        var redirect = URL.resolve(URL.format(parsedUrl), res.headers["location"]);
        process.nextTick(function() {
          sqrape(redirect, callback);
        });
        return;
      }
    }
    if (res.statusCode !== 200) return callback(new Error('URL: ' + url + ', StatusCode: ' + res.statusCode), null);
    var charset;
    var contentType = res.headers['content-type'];
    if (contentType) {
      var charsets = contentType.toLowerCase().match(/charset\=(.*)/i);
      if (charsets) {
        charset = charsets[1];
      }
    }
    var iconv, buf;
    if (charset === 'shift_jis' || charset === 'shiftjis' || charset === 'sjis') {
      charset = 'shift_jis';
      buf = new Buffer('');
      iconv = new Iconv('Shift_JIS', 'UTF-8//TRANSLIT//IGNORE');
    } else if (charset === 'euc-jp' || charset === 'euc_jp' || charset === 'eucjp') {
      charset = 'euc-jp';
      buf = new Buffer('');
      iconv = new Iconv('EUC-JP', 'UTF-8//TRANSLIT//IGNORE');
    } else if (charset === 'iso-2022-jp') {
      buf = new Buffer('');
      iconv = new Iconv('ISO-2022-JP', 'UTF-8//TRANSLIT//IGNORE');
    } else if (charset === 'utf8' || charset === 'utf-8') {
      charset = 'utf-8';
      buf = '';
      res.setEncoding('utf8');
    } else {
      charset = null;
      buf = new Buffer('');
    }

    res.on('data', function(chunk) {
      buf = buf.concat(chunk);
    });

    res.on('end', function() {
      // HTTP-Headerで変換する必要があるか判断できたなら変換
      if (iconv) {
        buf = iconv.convert(buf).toString('utf8');
        jsdom.env(buf, ['http://code.jquery.com/jquery.min.js'], function(err, window) {
          if (err) return callback(err, null);
          callback(null, window.jQuery);
        });
        return;
      }
      // UTF-8なら変換しない
      if (charset === 'utf-8') {
        jsdom.env(buf, ['http://code.jquery.com/jquery.min.js'], function(err, window) {
          if (err) return callback(err, null);
          callback(null, window.jQuery);
        });
        return;
      }
      // HTTP-Headerで文字コードが不明なら、HTMLのソースから判断
      jsdom.env(buf.toString(), ['http://code.jquery.com/jquery.min.js'], function(err, window) {
        if (err) console.log(err);
        if (err) return callback(err, null);
        var content = window.jQuery('meta[http-equiv="Content-Type"]').attr('content');
        if (content) {
          var charsets = content.toLowerCase().match(/charset\=(.*)/i);
          if (charsets) {
            charset = charsets[1];
            if (charset === 'shift_jis' || charset === 'shiftjis' || charset === 'sjis') {
              iconv = new Iconv('Shift_JIS', 'UTF-8//TRANSLIT//IGNORE');
            } else if (charset === 'euc-jp' || charset === 'euc_jp' || charset === 'eucjp') {
              iconv = new Iconv('EUC-JP', 'UTF-8//TRANSLIT//IGNORE');
            } else if (charset === 'iso-2022-jp') {
              iconv = new Iconv('ISO-2022-JP', 'UTF-8//TRANSLIT//IGNORE');
            }
            if (iconv) {
              buf = iconv.convert(buf).toString('utf8');
              jsdom.env(buf, ['http://code.jquery.com/jquery.min.js'], function(err, window) {
                if (err) return callback(err, null);
                callback(null, window.jQuery);
              });
              return;
            }
          }
        }
        callback(null, window.jQuery);
      });
    });

    res.on('error', function(err) {
      callback(err, null);
    });
  }).on('error', function(err) {
    callback(err, null);
  });
};
