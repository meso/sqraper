var should = require('chai').should();
var sqraper = require('../lib/sqraper');

describe('Google', function() {
  it('www.google.com', function(done) {
    sqraper('http://www.google.com/', function(err, $) {
      $('title').text().trim().should.equal('Google');
      done();
    });
  });

  it('www.google.co.jp', function(done) {
    sqraper('http://www.google.co.jp/', function(err, $) {
      $('title').text().trim().should.equal('Google');
      done();
    });
  });
});