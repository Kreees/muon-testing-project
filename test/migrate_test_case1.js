var Q = require("q");
//var cfg = {path: '/Users/andrejfilin/some'};
var path_length = __dirname.length;
var cfg = {path: __dirname.substr(0,path_length-5)};
var u = require('./lib/utils.js');
process.exit = function() {};

describe('migration module test: case 01 (add a model)', function() {
    var test_models_source_path = cfg.path + '/test/model_sets/set1/models_ch/';
//    var test_models_changed_path = cfg.path + '/test/model_sets/set1/models_ch/';

    before(function(done) {
        u.resetDatabases(['somedb']).then(function(){
           return u.clearHistory(cfg);
        }).then(function(){
           return u.resetModels(cfg, cfg.path + '/test/model_sets/set1/models_ch/');                
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
    
    it('should detect a new model', function(done) {
        try {
            m.diff.need.should.be.true;
            m.diff.rmModel.should.eql([]);
            m.diff.rmAttr.should.eql({});
            m.diff.addModel.should.not.eql([]);
            m.diff.addAttr.should.eql({});
            done();
        } catch(err) {
            console.log('ERROR ' + err);
            done(err)
        }
    });

    it('should add model to the database', function(done) {
        u.setMode('migration').then(function(){
            m.migration.migrate().done(function(){
                var Person = m.app.models.person;
                Person.get(1, function(err, result) {
                    if (err){
                        err.message.should.eql('Not found');
                        err.model.should.eql('person');
                        done();
                    }
                    else {
                        var error = new Error("Database contains instances.");
                        done(error);
                    }
                });
            },function(err){
                done(error);
            });
        });
    });

    it('should detect nothing', function(done) {
        u.setMode('migration').then(function(){
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

    it('should create an instance in a database', function(done) {
        u.addAndCheckInst('person', {surname: 'Opel', name: 'Andy', age: 23}, done);
    });

});