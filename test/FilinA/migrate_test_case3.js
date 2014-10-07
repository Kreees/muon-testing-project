//var m = require('muon');
var Q = require("q");
//var dbg = true;
var path_length = __dirname.length;
var cfg = {path: __dirname.substr(0,path_length-5)};
//var cfg = {path: '/Users/andrejfilin/some'};
// var fs = require('fs');
// var dir = cfg.path + '/migrations/';
// var g = require("grunt");
// var sh = require('should');
// var mysql = require('mysql');

var u = require('./lib/utils.js');
process.exit = function() {};


describe('migration module test: case 03 (add a model and an attribute)', function() {
    var test_models_source_path = cfg.path + '/test/model_sets/set3/models_s/';
    var test_models_changed_path = cfg.path + '/test/model_sets/set3/models_ch/';

    before(function(done) {
        u.resetDatabases(['somedb']).then(function(){
           return u.clearHistory(cfg);
        }).then(function(){
           return u.resetModels(cfg, test_models_source_path);                
        }).then(function(){
            return u.setMode('migration');
        }).then(function(){
            return m.migration.migrate();
        }).then(function(){
            return u.resetModels(cfg, test_models_changed_path);
        }).then(function(){
            return u.setMode('development');
        }).done(function(){
            done();
        },function(err){
            u.log('rejected');
            u.dbg(err);
            done(err);
        });
    });
    
    it('should detect new model and attribute', function(done) {
        m.diff.need.should.be.true;
        m.diff.rmModel.should.eql([]);
        m.diff.rmAttr.should.eql({});
        m.diff.addModel.should.not.eql([]);
        m.diff.addAttr.should.not.eql({});
        done();
    });

    it('should add new model and attribute to the database', function(done) {
        return u.setMode('migration').then(function(){
            return m.migration.migrate();
        }).done(function(){
            done();
        },function(err){done(err)});
    });

    it('should detect nothing', function(done) {
        return u.setMode('development').then(function() {
            try {
                m.diff.need.should.be.false;
                m.diff.rmModel.should.eql([]);
                m.diff.rmAttr.should.eql({});
                m.diff.addModel.should.eql([]);
                m.diff.addAttr.should.eql({});
                done();
            } catch(err) {
                console.log('ERROR ' + err);
                done(err);
            }
        });
    }); 

    it('should add an instance with new attribute', function(done) {
        u.addAndCheckInst('person', {surname: 'Opel', name: 'Andy', age: 23, weight: 100}, done);
    });

    it('should add an instance of new model', function(done) {
        u.addAndCheckInst('car', {brand: 'Opel', name: 'Astra', number: 279, engine: 'x18xe1'}, done);
    });

});