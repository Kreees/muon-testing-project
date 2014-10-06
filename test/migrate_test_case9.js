var Q = require("q");
var path_length = __dirname.length;
var cfg = {path: __dirname.substr(0,path_length-5)};
global.__mcfg__ = { serverMode: 'development' };
// var muon = require('muon');
var u = require('./lib/utils.js');
// process.exit = function() {};

describe('migration module test: case 09 (change attribute for models in different databases)', function() {
    var test_models_source_path = cfg.path + '/test/model_sets/set9/models_s/';
    var test_models_changed_path = cfg.path + '/test/model_sets/set9/models_ch/';

    before(function(done) {
        global.__mcfg__ = { serverMode: 'development' };
        u.resetDatabases(['somedb','testdb']).then(function(){
           return u.clearHistory(cfg);
        }).then(function(){
           return u.resetModels(cfg, test_models_source_path);                
        }).then(function(){
            return u.setMode('migration');
        }).then(function(){
            return m.migration.migrate();
        }).then(function(){
            return u.resetModels(cfg, test_models_changed_path);
        }).done(function(){
            done();
        },function(err){
            u.dbg(err);
            done(err);
        });
    });

    it('should detect attribute change', function(done) {
        u.setMode('development').then(function(){
            try {
                m.diff.need.should.be.true;
                m.diff.rmModel.should.eql([]);
                m.diff.rmAttr.should.not.eql({});
                m.diff.addModel.should.eql([]);
                m.diff.addAttr.should.not.eql({});
                done();
            }
            catch(err) {console.log('ERROR ' + err); done(err)}
        });
    });

    it('should change attribute', function(done) {
        u.resetModels(cfg, test_models_changed_path).then(function(){
            return u.setMode('migration');
        }).then(function(){
            m.migration.migrate().done(function() {
                // u.addAndCheckInst('person', {surname: 'Opel', name: 'Andy', age: 23}, done);
                done();
            }, function(err){
                done(err);
            });

        });
    });
    // it('should add an instance with new attribute', function(done) {
        // u.addAndCheckInst('person', {surname: 'Opel', name: 'Andy', age: 23, weight: 100}, done);
    // });
// 
    // it('should add an instance of new model', function(done) {
        // u.addAndCheckInst('car', {brand: 'Opel', name: 'Astra', number: 279, engine: 'x18xe1'}, done);
    // });
    
    it('should detect nothing', function(done) {
        u.setMode('development').then(function(){
            try {
                m.diff.need.should.be.false;
                m.diff.rmModel.should.eql([]);
                m.diff.rmAttr.should.eql({});
                m.diff.addModel.should.eql([]);
                m.diff.addAttr.should.eql({});
                done();
            }
            catch(err) {console.log('ERROR '+err); done(err)}
        });

    });

});