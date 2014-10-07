var Q = require("q");
var u = require('./lib/utils.js');
var path_length = __dirname.length;
var cfg = {path: __dirname.substr(0,path_length-5)};
var fs = require('fs');
var sh = require('should'); //do it before all tests

describe('migration module test m1: create self directories and files if need', function() {
    describe('clear directories and files', function() {
        before(function() {
             u.rmdirSync(cfg.path + '/migrations');
        });
        it('should create migration directory', function() {
            fs.existsSync(cfg.path+"/migrations/").should.be.false;
        });
        it('should create database for migration history', function() {
            fs.existsSync(cfg.path+"/migrations/history.db").should.be.false;
        });
        it('should create directory for magic files', function() {
            fs.existsSync(cfg.path+"/migrations/magic/").should.be.false;
        });
    });
    describe('create self directories and files', function() {
        before(function(done) {
            u.resetModels(cfg, cfg.path + '/test/model_sets/m1/').then(function(){
                return u.setMode('development');
            }).done(function(){
                done();
            },function(err){
                u.dbg(err +' (rejected)');
                done(err);
            });
        });
        it('should create migration directory', function() {
            fs.existsSync(cfg.path+"/migrations/").should.be.true;
        });
        it('should create database for migration history', function() {
            fs.existsSync(cfg.path+"/migrations/history.db").should.be.true;
        });
        it('should create directory for magic files', function() {
            fs.existsSync(cfg.path+"/migrations/magic/").should.be.true;
        });
    });
});