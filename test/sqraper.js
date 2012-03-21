var should = require('should');
var sqraper = require('../lib/sqraper');

describe('UTF-8', function() {
  it('www.google.com', function(done) {
    sqraper('http://www.google.com/', function(err, $) {
      should.not.exist(err);
      $('title').text().trim().should.equal('Google');
      done();
    });
  });

  it('www.google.co.jp', function(done) {
    sqraper('http://www.google.co.jp/', function(err, $) {
      should.not.exist(err);
      $('title').text().trim().should.equal('Google');
      done();
    });
  });
});

describe('EUC-JP', function() {
  it('FC2ホームページ', function(done) {
    sqraper('http://web.fc2.com/', function(err, $) {
      $('title').text().trim().should.equal('FC2ホームページ - 無料ホームページスペース');
      done();
    });
  });

  it('朝日新聞', function(done) {
    sqraper('http://www.asahi.com/', function(err, $) {
      $('title').text().trim().should.equal('朝日新聞デジタル：朝日新聞社のニュースサイト');
      done();
    });
  });
});

describe('Shift_JIS', function() {
  it('歴代内閣', function(done) {
    sqraper('http://www.kantei.go.jp/jp/rekidainaikaku.html', function(err, $) {
      $('title').text().trim().should.equal('歴代内閣・内閣制度 -首相官邸ホームページ-');
      done();
    });
  });

  it('ニコモバ紹介ページ', function(done) {
    sqraper('http://info.nicovideo.jp/pr_nicom/', function(err, $) {
      $('title').text().trim().should.equal('ニコニコ動画モバイルのご紹介');
      done();
    });
  });
});